import { ipcMain, app, BrowserWindow } from "electron"
import { is } from "@electron-toolkit/utils" 
import path from "path"
import fs from "fs"
import { spawn } from "child_process"
import { sanitizeName } from "../../utils/functions/sanitizeName"

export const downloadsRoot = () => path.join(app.getPath("userData"), "userData", "localStorage", "animeDownload")

const bin = (name) =>
  is.dev
    ? path.join(__dirname, "..", "..", "resources", "bin", name)
    : path.join(process.resourcesPath, "app.asar.unpacked", "resources", "bin", name)

export function isInside(root, target) {
  const rel = path.relative(root, path.resolve(target))
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel)
}

const readJson = async (p, fallback) => {
  try { return JSON.parse(await fs.promises.readFile(p, "utf-8")) } catch { return fallback }
}
const writeJson = (p, v) => fs.promises.writeFile(p, JSON.stringify(v, null, 2), "utf-8")
const send = (channel, payload) =>
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(channel, payload))

const active = new Map() 

export function registerDownloadHandlers() {
  ipcMain.handle("download-video", async (_e, videoUrl, meta) => {
    if (!/^https?:\/\//i.test(videoUrl)) throw new Error("URL de téléchargement invalide")
    const { episodeTitle, seasonTitle, animeTitle, animeCover } = meta
    const animeFolder = path.join(downloadsRoot(), sanitizeName(animeTitle))
    const seasonFolder = path.join(animeFolder, sanitizeName(seasonTitle))
    const baseName = sanitizeName(episodeTitle)
    const episodePath = path.join(seasonFolder, `${baseName}.mp4`)
    const coverPath = path.join(animeFolder, "cover.jpg")
    const dataPath = path.join(animeFolder, "animeData.json")
    if (active.has(episodePath)) return "already-running"

    await fs.promises.mkdir(seasonFolder, { recursive: true })
    if (!fs.existsSync(coverPath) && /^https?:/i.test(animeCover ?? "")) {
      try {
        const res = await fetch(animeCover)
        await fs.promises.writeFile(coverPath, Buffer.from(await res.arrayBuffer()))
      } catch (err) { console.warn("[download] cover :", err.message) }
    }

    const setState = async (state, extra = {}) => {
      const d = await readJson(dataPath, {})
      d.animeTitle ??= animeTitle
      d.animeCover ??= coverPath
      d.season ??= {}
      d.season[seasonTitle] ??= {}
      d.season[seasonTitle][episodeTitle] = { videoPath: episodePath, downloadedAt: null, ...d.season[seasonTitle][episodeTitle], state, ...extra }
      await writeJson(dataPath, d)
    }
    await setState("downloading")

    const args = [
      "--ffmpeg-location", bin("ffmpeg.exe"),
      "--force-overwrites", "--no-part", "--newline", "--no-playlist",
      "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      "--merge-output-format", "mp4",
      "-o", path.join(seasonFolder, `${baseName}.%(ext)s`),
      "--", videoUrl,
    ]
    return new Promise((resolve, reject) => {
      const child = spawn(bin("yt-dlp.exe"), args, { windowsHide: true })
      active.set(episodePath, child)
      let lastErr = ""
      const onData = (buf) => {
        for (const line of buf.toString().split(/\r?\n/)) {
          const m = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%(?:.*?ETA\s+(\S+))?/)
          if (m) send("download-progress", { animeTitle, seasonTitle, episodeTitle, percent: parseFloat(m[1]), eta: m[2] ?? null, videoUrl })
        }
      }
      child.stdout.on("data", onData)
      child.stderr.on("data", (b) => { lastErr = b.toString().slice(-500) })
      child.on("error", async (err) => { active.delete(episodePath); await setState("error"); reject(err) })
      child.on("close", async (code) => {
        active.delete(episodePath)
        if (code === 0) {
          await setState("downloaded", { downloadedAt: new Date().toISOString() })
          resolve("ok")
        } else {
          await setState("error") 
          reject(new Error(lastErr || `yt-dlp a quitté avec le code ${code}`))
        }
      })
    })
  })

  ipcMain.handle("cancel-download", (_e, episodePath) => {
    const child = active.get(episodePath)
    if (child) child.kill()
    return !!child
  })

  ipcMain.handle("get-downloads", async () => {
    const root = downloadsRoot()
    const episodes = []
    let entries = []
    try { entries = await fs.promises.readdir(root, { withFileTypes: true }) } catch { /* dossier absent */ }
    for (const ent of entries.filter((e) => e.isDirectory())) {
      const data = await readJson(path.join(root, ent.name, "animeData.json"), null)
      if (!data) continue
      for (const [seasonTitle, eps] of Object.entries(data.season ?? {})) {
        for (const [episodeTitle, ep] of Object.entries(eps)) {
          episodes.push({
            name: `${data.animeTitle} - ${seasonTitle} : ${episodeTitle}`,
            path: ep.videoPath,
            cover: data.animeCover,
            metadata: { animeTitle: data.animeTitle, animeCover: data.animeCover, seasonTitle, episodeTitle,
                        videoPath: ep.videoPath, downloadedAt: ep.downloadedAt, state: ep.state },
          })
        }
      }
    }
    return { folderPath: root, episodes }
  })

  ipcMain.handle("delete-episode", async (_e, filePath) => {
    const root = downloadsRoot()
    if (!isInside(root, filePath) || path.extname(filePath).toLowerCase() !== ".mp4")
      throw new Error("Chemin refusé") 
    await fs.promises.rm(filePath, { force: true })
    const seasonDir = path.dirname(filePath)
    const animeDir = path.dirname(seasonDir)
    const dataPath = path.join(animeDir, "animeData.json")
    const data = await readJson(dataPath, null)
    if (data) {
      for (const [st, eps] of Object.entries(data.season ?? {})) {
        for (const [et, v] of Object.entries(eps)) if (path.resolve(v.videoPath) === path.resolve(filePath)) delete eps[et]
        if (Object.keys(eps).length === 0) delete data.season[st]
      }
      if (Object.keys(data.season ?? {}).length === 0) await fs.promises.rm(animeDir, { recursive: true, force: true })
      else await writeJson(dataPath, data)
    }
    return { success: true }
  })
}
