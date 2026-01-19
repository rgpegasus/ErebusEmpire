import { app, shell, session, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import path from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { ErebusIcon } from '@utils/dispatchers/Pictures';
import { AnimeScraper } from 'better-ani-scraped';
// import { AnimeScraper } from "../../../../BOT/better-ani-scraped/index.js"
import fsExtra from 'fs-extra'; 
import fs from 'fs';
import { Client } from '@xhayper/discord-rpc';
const clientId = '1366193765701783604';
const rpc = new Client({ transport: { type: 'ipc' }, clientId });
const scraper = new AnimeScraper("animesama");



import {
  SearchAnime,
  RandomAnime,
  InfoAnime,
  SeasonsAnime,
  EpisodesSeason,
  UrlEpisode,
  LatestEpisodes,
  LatestScans,
  CatalogAnime,
  DownloadEpisode,
  DownloadList,
  DeleteDownloadEpisode,
  ExportData,
  ImportData,
  AvailableLanguages,
  ScansChapter,
  ScansImg,
  WorkingUrl,
} from "@utils/dispatchers/IpcHandler" 
import { AnimeCoverTemp, AnimeData } from '@utils/dispatchers/ServicesData'
import { spawn } from 'child_process';


function launchBackgroundScript() {
  const scriptPath = join(__dirname, 'background', 'background.js');

  const subprocess = spawn(process.execPath, [scriptPath], {
    detached: false,
    stdio: 'ignore'
  });

  subprocess.unref();
}

launchBackgroundScript();
const sessionStorage = join(app.getPath('appData'), 'Erebus Empire', 'userData', 'sessionStorage');

let startTimestamp = null;
let mainWindow = null;
let deeplinkingUrl = null;

async function setActivity(details = "Dans la liste d'animés", state = 'Sur Erebus Empire') {
  if (!rpc) return;
  if (!startTimestamp) startTimestamp = new Date();

  rpc.user.setActivity({
    details,
    state,
    startTimestamp,
    largeImageKey: 'icon',
    largeImageText: 'Erebus Empire',
    instance: false,
    type: 3, 
    buttons: [
      { label: "Discord", url: "https://discord.gg/Mj9cYRQTcU" },
      { label: "Installer", url: "https://github.com/rgpegasus/ErebusEmpire/releases/latest" }
    ],
  });
}

rpc.on('ready', () => {
  setActivity();
});

rpc.login({ clientId }).catch(console.error);
function handleDeepLink(url) {
  if (mainWindow) {
    if (mainWindow.webContents.isLoading()) {
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('deep-link', url);
      });
    } else {
      mainWindow.webContents.send('deep-link', url);
    }
  }
}
function createWindow(route = '/') {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    minWidth: 960,
    minHeight: 540,
    show: false,
    autoHideMenuBar: false,
    frame: false,
    titleBarStyle: "hidden",
    fullscreen: false,
    ...(process.platform === "linux" ? { icon: ErebusIcon } : {}),
    webPreferences: {
      webSecurity: false,
      preload: join(__dirname, "../preload/preload.js"),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })
  
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('erebusempire', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('erebusempire');
  }
  const logToRenderer = (msg) => {
    if (mainWindow) mainWindow.webContents.send('log-from-main', msg);
  };

  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, encoding, callback) => {
    logToRenderer(chunk.toString());
    originalStdoutWrite(chunk, encoding, callback);
  };

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.maximize();
      mainWindow.show();
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#' + route);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: route });
  }

  mainWindow.on('closed', () => {
    try {
      if (fs.existsSync(sessionStorage)) {
        fsExtra.removeSync(sessionStorage);
      }
    } catch (error) {
      console.error('Erreur suppression sessionStorage :', error);
    }

    mainWindow = null;
  });
}

module.exports = {
  getMainWindow: () => mainWindow
};
app.on('open-url', (event, url) => {
  event.preventDefault();
  deeplinkingUrl = url;
  handleDeepLink(url);
});

if (process.platform === 'win32') {
  const url = process.argv.find(arg => arg.startsWith('erebusempire://'));
  if (url) {
    deeplinkingUrl = url;
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    const url = argv.find(arg => arg.startsWith('erebusempire://'));
    if (url) {
      deeplinkingUrl = url;
      if (mainWindow) {
        mainWindow.webContents.send('deep-link', deeplinkingUrl);
      }
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(async  () => {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      details.requestHeaders["Referer"] = "https://vidmoly.net/"
      details.requestHeaders["Origin"] = "https://vidmoly.net"
      callback({ requestHeaders: details.requestHeaders })
    })
    electronApp.setAppUserModelId("com.erebus-empire.app")
    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
    const route = deeplinkingUrl ? deeplinkingUrl.replace("erebusempire://", "") : "/"
    createWindow(route)

    ipcMain.on(
      "update-rich-presence",
      (event, { anime, episode, cover, startTimestamp, endTimestamp }) => {
        if (!rpc || !rpc.user || typeof rpc.user.setActivity !== "function") {
          console.warn("Rich Presence non prêt : rpc ou rpc.user non défini")
          return
        }
        rpc.user.setActivity({
          details: `Regarde ${anime}`,
          state: `${episode}`,
          startTimestamp: startTimestamp ? new Date(startTimestamp) : new Date(),
          endTimestamp: endTimestamp ? new Date(endTimestamp) : undefined,
          largeImageKey: `${cover}`,
          largeImageText: `${anime}`,
          instance: false,
          type: 3,
          buttons: [
            { label: "Discord", url: "https://discord.gg/Mj9cYRQTcU" },
            {
              label: "Installer",
              url: "https://github.com/rgpegasus/ErebusEmpire/releases/latest",
            },
          ],
        })
      },
    )

    ipcMain.on("defaul-rich-presence", () => {
      if (!rpc) return
      if (!startTimestamp) startTimestamp = new Date()
      setActivity()
    })
    SearchAnime(scraper)
    RandomAnime(scraper)
    InfoAnime(scraper)
    SeasonsAnime(scraper)
    EpisodesSeason(scraper)
    UrlEpisode()
    LatestEpisodes(scraper)
    LatestScans(scraper)
    CatalogAnime(scraper)
    AvailableLanguages(scraper)
    ScansChapter(scraper)
    ScansImg(scraper)
    WorkingUrl(scraper)
    AnimeData()
    DownloadEpisode()
    DownloadList()
    DeleteDownloadEpisode()
    ExportData()
    ImportData()
    AnimeCoverTemp()

    ipcMain.on("open-devtools", () => {
      if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.openDevTools({ mode: "detach" })
      }
    })

    ipcMain.on("close-devtools", () => {
      if (mainWindow && mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
      }
    })

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  ipcMain.on('window-minimize', () => mainWindow.minimize());

  ipcMain.on('window-toggle-fullscreen', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });


  ipcMain.on('window-close', () => {
    mainWindow = null;
    app.quit(); 
  });
}