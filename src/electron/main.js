import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join} from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { ErebusIcon } from '@utils/PictureDispatcher';
import {AnimeScraper} from 'better-ani-scraped';
import RPC from 'discord-rpc';
const clientId = '1366193765701783604';
const rpc = new RPC.Client({ transport: 'ipc' });
const scraper = new AnimeScraper("animesama");
import { SearchAnime, RandomAnime, InfoAnime, SeasonsAnime, EpisodesSeason, UrlEpisode, LatestEpisodes, CatalogAnime, DownloadEpisode, DownloadList, DeleteDownloadEpisode, ExportData, ImportData } from '@utils/IpcHandlerDispatcher.js'; 


let startTimestamp = null;
let mainWindow = null;

async function setActivity(details = 'En train de mater des animés', state = 'Sur Erebus Empire') {
  if (!rpc) return;
  if (!startTimestamp) startTimestamp = new Date();

  rpc.setActivity({
    details,
    state,
    startTimestamp,
    largeImageKey: 'icon',
    largeImageText: 'Erebus Empire',
    instance: false,
  });
}

rpc.on('ready', () => {
  setActivity();
});

rpc.login({ clientId }).catch(console.error);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    minWidth: 1200,
    minHeight: 720,
    show: false,
    autoHideMenuBar: false,
    frame: true,
    fullscreen: true,
    ...(process.platform === 'linux' ? { icon: ErebusIcon } : {}),
    webPreferences: {
      webSecurity: false,
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false
    }
  });

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
      mainWindow.show();
      mainWindow.setFullScreen(true);
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Expose mainWindow if needed
module.exports = {
  getMainWindow: () => mainWindow
};

// Gestion de la single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.electron');

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    ipcMain.on('update-rich-presence', (event, { anime, episode }) => {
      if (!rpc) return;
      if (!startTimestamp) startTimestamp = new Date();
      rpc.setActivity({
        details: `Regarde ${anime}`,
        state: `${episode}`,
        startTimestamp,
        largeImageKey: 'icon',
        largeImageText: 'Erebus Empire',
        smallImageKey: 'play',
        instance: false,
      });
    });

    ipcMain.on('defaul-rich-presence', () => {
      if (!rpc) return;
      if (!startTimestamp) startTimestamp = new Date();
      rpc.setActivity({
        details: "Se promène dans la liste d'animés",
        state: 'Sur Erebus Empire',
        startTimestamp,
        largeImageKey: 'icon',
        largeImageText: 'Erebus Empire',
        instance: false,
      });
    });

    SearchAnime(scraper);
    RandomAnime(scraper);
    InfoAnime(scraper);
    SeasonsAnime(scraper);
    EpisodesSeason(scraper);
    UrlEpisode();
    LatestEpisodes(scraper);
    CatalogAnime(scraper);
    DownloadEpisode();
    DownloadList();
    DeleteDownloadEpisode();
    ExportData();
    ImportData();

    createWindow();

    ipcMain.on('open-devtools', () => {
      if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    });

    ipcMain.on('close-devtools', () => {
      if (mainWindow && mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
