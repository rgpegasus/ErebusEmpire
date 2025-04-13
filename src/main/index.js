import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import {AnimeScraper, getVideoUrlFromEmbed} from 'ani-scraped';

const scraper = new AnimeScraper("animesama");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    minHeight:700,
    minWidth:900,
    show: false,
    autoHideMenuBar: false,
    frame: true,
    fullscreen:true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      webSecurity: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.setFullScreen(true);
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else { 
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('search-anime', async (event, query) => {
    try {
      return await scraper.searchAnime(query, 5);
    } catch (error) {
      console.error('Erreur dans le main process:', error);
      return [];
    }
  });
  ipcMain.handle("random-anime", async (event)=> {
    try {
      return await scraper.getRandomAnime();
       
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
  ipcMain.handle("info-anime", async (event, query)=> {
    try {
      return await scraper.getAnimeInfo(query);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
  ipcMain.handle("get-seasons", async (event, query)=> {
    try {
      return await scraper.getSeasons(query, "vostfr");
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
  ipcMain.handle("get-episodes", async (event, query)=> {
    try {
      return await scraper.getEmbed(query, ["sibnet","vidmoly"]);
      // return await scraper.getEmbed(query, ["vidmoly", "sibnet"]);
      // return await scraper.getEmbed(query, ["senvid", "vidmoly", "sibnet"]);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
  ipcMain.handle("get-url", async (event, query)=> {
    try {
      return await getVideoUrlFromEmbed("sibnet", query);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
  ipcMain.handle("get-latest-episode", async (event)=> {
    try {
      return await scraper.getLatestEpisodes(["vostfr", "vf"]);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
  ipcMain.handle("get-all-anime", async (event)=> {
    try {
      return await scraper.getAllAnime();
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });


  createWindow()

  app.on('activate', function () {
    
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
