import { app, shell, session, protocol, net, BrowserWindow, ipcMain } from "electron"
import { join } from "path"
import path from "path"
import fs from "fs"
import { pathToFileURL } from "url"
import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import { AnimeScraper } from "better-ani-scraped"
import { ErebusIcon } from "@utils/dispatchers/Pictures"
import { registerScraperHandlers } from "./ipc/scraper"
import { registerLocalData } from "./ipc/localData"
import { registerDownloadHandlers, downloadsRoot, isInside } from "./ipc/downloads"
import { initPresence } from "./presence"

const PROTOCOL = "erebusempire"
const MEDIA_SCHEME = "erebus-media"

protocol.registerSchemesAsPrivileged([
  { scheme: MEDIA_SCHEME, privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true } },
])

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let mainWindow = null
let pendingDeepLink = process.argv.find((a) => a.startsWith(`${PROTOCOL}://`)) ?? null

const routeFromDeepLink = (url) => {
  const route = url.replace(`${PROTOCOL}://`, "")
  return /^[\w\-./%]+$/.test(route) && !route.includes("..") ? `/${route.replace(/^\/+/, "")}` : "/"
}

function sendDeepLink(url) {
  if (!mainWindow) { pendingDeepLink = url; return }
  const send = () => mainWindow?.webContents.send("deep-link", routeFromDeepLink(url))
  mainWindow.webContents.isLoading() ? mainWindow.webContents.once("did-finish-load", send) : send()
}

function createWindow(route = "/") {
  mainWindow = new BrowserWindow({
    width: 1500, height: 1000, minWidth: 960, minHeight: 540,
    show: false, frame: false, titleBarStyle: "hidden",
    ...(process.platform === "linux" ? { icon: ErebusIcon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: true,
    },
  })

  mainWindow.on("ready-to-show", () => { mainWindow.maximize(); mainWindow.show() })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url) 
    return { action: "deny" }
  })
  mainWindow.webContents.on("will-navigate", (e, url) => {
    const own = is.dev && process.env.ELECTRON_RENDERER_URL && url.startsWith(process.env.ELECTRON_RENDERER_URL)
    if (!own && !url.startsWith("file://")) e.preventDefault()
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) mainWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}#${route}`)
  else mainWindow.loadFile(join(__dirname, "../renderer/index.html"), { hash: route })

  mainWindow.on("closed", () => { mainWindow = null })
}

const HEADER_RULES = [
  { match: /(^|\.)uqload\.(vc|com|to)$/i, referer: "https://uqload.vc/" },
]
const DEFAULT_MEDIA_REFERER = "https://vidmoly.net/"
const OWN_HOSTS = /(^|\.)(supabase\.co|supabase\.in|localhost|127\.0\.0\.1|discord\.com|github\.com|anime-sama\.[a-z]+)$/i

function setupNetworkRules() {
  const ses = session.defaultSession
  ses.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

  ses.webRequest.onBeforeSendHeaders({ urls: ["http://*/*", "https://*/*"] }, (details, cb) => {
    const { hostname } = new URL(details.url)
    const h = details.requestHeaders
    const rule = HEADER_RULES.find((r) => r.match.test(hostname))
    if (rule) {
      h["Referer"] = rule.referer
      h["Origin"] = new URL(rule.referer).origin
    } else if (!OWN_HOSTS.test(hostname) && ["media", "xhr", "other"].includes(details.resourceType)) {
      h["Referer"] = DEFAULT_MEDIA_REFERER
      h["Origin"] = new URL(DEFAULT_MEDIA_REFERER).origin
    }
    cb({ requestHeaders: h })
  })

  ses.webRequest.onHeadersReceived({ urls: ["http://*/*", "https://*/*"] }, (details, cb) => {
    const { hostname } = new URL(details.url)
    if (OWN_HOSTS.test(hostname) || !["media", "xhr", "other"].includes(details.resourceType)) return cb({})
    const headers = Object.fromEntries(
      Object.entries(details.responseHeaders ?? {}).filter(([k]) => !k.toLowerCase().startsWith("access-control-")),
    )
    headers["Access-Control-Allow-Origin"] = ["*"]
    headers["Access-Control-Allow-Headers"] = ["*"]
    cb({ responseHeaders: headers })
  })
}

function setupMediaProtocol() {
  protocol.handle(MEDIA_SCHEME, (request) => {
    const abs = decodeURIComponent(new URL(request.url).pathname.slice(1))
    if (!isInside(downloadsRoot(), abs) || !fs.existsSync(abs)) return new Response("Not found", { status: 404 })
    return net.fetch(pathToFileURL(abs).toString(), { headers: request.headers })
  })
}

function registerWindowHandlers() {
  const win = () => mainWindow
  ipcMain.on("window-minimize", () => win()?.minimize())
  ipcMain.on("window-toggle-fullscreen", () => (win()?.isMaximized() ? win().unmaximize() : win()?.maximize()))
  ipcMain.on("window-close", () => app.quit())
  ipcMain.on("open-devtools", () => win()?.webContents.openDevTools({ mode: "detach" }))
  ipcMain.on("close-devtools", () => win()?.webContents.closeDevTools())
  ipcMain.handle("get-install-date", async () => (await fs.promises.stat(app.getPath("userData"))).birthtime.toISOString())
  ipcMain.on("set-fullscreen", (_e, v) => win()?.setFullScreen(Boolean(v)))
}

app.on("second-instance", (_e, argv) => {
  const url = argv.find((a) => a.startsWith(`${PROTOCOL}://`))
  if (url) sendDeepLink(url)
  if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus() }
})
app.on("open-url", (e, url) => { e.preventDefault(); sendDeepLink(url) })
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit() })
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

if (process.defaultApp && process.argv.length >= 2) app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])])
else app.setAsDefaultProtocolClient(PROTOCOL)

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.erebus-empire.app")
  app.on("browser-window-created", (_e, w) => optimizer.watchWindowShortcuts(w))

  setupNetworkRules()
  setupMediaProtocol()

  const scraper = new AnimeScraper("animesama")
  registerScraperHandlers(scraper)
  registerLocalData()
  registerDownloadHandlers()
  registerWindowHandlers()
  initPresence()

  createWindow(pendingDeepLink ? routeFromDeepLink(pendingDeepLink) : "/")
})
