import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import { join, resolve} from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/pictures/logo_app_only.png';
import {AnimeScraper, getVideoUrlFromEmbed} from 'better-ani-scraped';
import { exec } from 'child_process';
import fs from 'fs';
import isDev from 'electron-is-dev';
import RPC from 'discord-rpc';
const clientId = '1366193765701783604';
const rpc = new RPC.Client({ transport: 'ipc' });
let startTimestamp = null;
import JSZip from 'jszip';

async function setActivity(details = 'En train de mater des animés', state = 'Sur Erebus Empire') {
  if (!rpc) return;
  if (!startTimestamp) {
    startTimestamp = new Date();
}
  rpc.setActivity({
      details,
      state,
      startTimestamp: new Date(),
      largeImageKey: 'icon',
      largeImageText: 'Erebus Empire',
      instance: false,
  });
}

rpc.on('ready', () => {
    setActivity();
});

rpc.login({ clientId }).catch(console.error);




const scraper = new AnimeScraper("animesama");
import path from 'path';

const chromePath = isDev
  ? join(__dirname, '..', '..', 'puppeteer', 'chrome', 'win64-135.0.7049.95', 'chrome-win64', 'chrome.exe')
  : join(process.resourcesPath, 'app.asar.unpacked', 'puppeteer', 'chrome', 'win64-135.0.7049.95', 'chrome-win64', 'chrome.exe');


let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    minWidth: 1280,
    minHeight: 720,
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
  const logToRenderer = (msg) => {
    mainWindow?.webContents.send('log-from-main', msg);
  };

  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, encoding, callback) => {
    logToRenderer(chunk.toString());
    originalStdoutWrite(chunk, encoding, callback);
  };
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

module.exports = {
  getMainWindow: () => mainWindow
};

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  
  ipcMain.on('update-rich-presence', (event, { anime, episode}) => {
    if (!rpc) return;
    
    if (!startTimestamp) {
        startTimestamp = new Date();
    }
    
    rpc.setActivity({
        details: `Regarde ${anime}`,
        state: `${episode}`,
        startTimestamp: startTimestamp,
        largeImageKey: 'icon',
        largeImageText: 'Erebus Empire',
        smallImageKey: 'play',
        instance: false,
    });
});
ipcMain.on('defaul-rich-presence', () => {
  if (!rpc) return;

  if (!startTimestamp) {
    startTimestamp = new Date();
  }

  rpc.setActivity({
    details: "Se promène dans la liste d'animés",
    state: 'Sur Erebus Empire',
    startTimestamp: startTimestamp,
    largeImageKey: 'icon',
    largeImageText: 'Erebus Empire',
    instance: false,
  });
});
  ipcMain.handle('search-anime', async (event, query, limit, page) => {
    try {
      return await scraper.searchAnime(query, limit, ["vostfr"], ["Anime", "Film"], page);
    } catch (error) {
      console.error('Erreur dans le main process:', error);
      return [];
    }
  });
  ipcMain.handle("random-anime", async (event)=> {
    try {
      return await scraper.getRandomAnime(["vostfr"], ["Anime", "Film"]);
       
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
      return await scraper.getEmbed(query, ["oneupload", "sibnet", "sendvid"], chromePath);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
  ipcMain.handle("get-url", async (event, query, host)=> {
    try {
      return await getVideoUrlFromEmbed(host, query);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
  ipcMain.handle("get-latest-episode", async (event)=> {
    try {
      return await scraper.getLatestEpisodes(["vostfr"]); 
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
  ipcMain.handle("get-all-anime", async (event, page = null)=> {
    try {
      return await scraper.getAllAnime(["vostfr"], ["Anime", "Film"], page);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
  // Défini ce dossier de base une fois
const baseFolder = path.join(app.getPath('appData'), 'erebus-empire', 'userData', 'animeDownload');
function sanitizeName(name) {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // enlève les accents
    .replace(/[^a-zA-Z0-9 ]/g, '')                    // enlève les caractères spéciaux sauf espaces
    .replace(/\s+/g, ' ')                              // normalise les espaces
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(''); // tu peux remplacer '' par '_' si tu préfères
}
  ipcMain.handle('download-video', async (event, videoUrl, metaData) => {
  const { episodeTitle, seasonTitle, animeTitle, animeCover } = metaData;

  const ytDlpPath = isDev
    ? path.join(__dirname, '..', '..', 'resources', 'bin', 'yt-dlp.exe')
    : path.join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'bin', 'yt-dlp.exe');

  const userDataFolder = baseFolder;
  const animeFolder = path.join(userDataFolder,  sanitizeName(animeTitle));
  const seasonFolder = path.join(animeFolder,  sanitizeName(seasonTitle));
  const episodePath = path.join(seasonFolder, `${sanitizeName(episodeTitle)}.mp4`);
  const coverPath = path.join(animeFolder, 'cover.jpg');
  const dataJsonPath = path.join(animeFolder, 'animeData.json');

  [userDataFolder, animeFolder, seasonFolder].forEach((f) => {
    if (!fs.existsSync(f)) fs.mkdirSync(f, { recursive: true });
  });

  if (!fs.existsSync(coverPath)) {
    try {
      const res = await fetch(animeCover);
      const buf = await res.arrayBuffer();
      fs.writeFileSync(coverPath, Buffer.from(buf));
    } catch (err) {
    }
  }

  const animeData = fs.existsSync(dataJsonPath)
    ? JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'))
    : {};
  animeData.animeTitle ??= animeTitle;
  animeData.animeCover ??= coverPath;
  animeData.season ??= {};
  animeData.season[seasonTitle] ??= {};
  animeData.season[seasonTitle][episodeTitle] = {
    videoPath: episodePath,
    downloadedAt: null,
    state: "downloading"
  };
  fs.writeFileSync(dataJsonPath, JSON.stringify(animeData, null, 2));

  const command = `"${ytDlpPath}" -o "${episodePath}" "${videoUrl}"`;

  return new Promise((resolve, reject) => {
    const downloadProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(stderr);
      }
      const updated = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
      updated.season[seasonTitle][episodeTitle].downloadedAt = new Date().toISOString();
      updated.season[seasonTitle][episodeTitle].state = "downloaded";
      fs.writeFileSync(dataJsonPath, JSON.stringify(updated, null, 2));
      resolve(stdout);
    });

    downloadProcess.stdout.on('userData', (data) => {
      const output = data.toString();
      const match = output.match(/\[download\]\s+(\d+(?:\.\d+)?)%.*?ETA (\d+:\d+)/);
      const mainWindow = BrowserWindow.getAllWindows()[0];
    
      if (match) {
        const percent = match[1];
        const eta = match[2];
        if (mainWindow) {
          mainWindow.webContents.send('download-progress', {
            animeTitle,
            seasonTitle,
            episodeTitle,
            percent: parseFloat(percent),
            eta,
            videoUrl
          });
        }
      } else {
        const percentOnly = output.match(/(\d+(?:\.\d+)?)%/);
        if (percentOnly && mainWindow) {
          mainWindow.webContents.send('download-progress', {
            animeTitle,
            seasonTitle,
            episodeTitle,
            percent: parseFloat(percentOnly[1]),
            eta: null,
            videoUrl
          });
        }
      }
    });      
    downloadProcess.stderr.on('userData', (data) => {
    });
  });
});
ipcMain.handle('get-downloads', async () => {
  const userDataFolder = baseFolder;
  try {
    const animeFolders = fs.readdirSync(userDataFolder)
      .map(name => path.join(userDataFolder, name))
      .filter(p => fs.lstatSync(p).isDirectory());

    const episodes = [];

    for (const animeFolder of animeFolders) {
      const dataPath = path.join(animeFolder, 'animeData.json');
      if (!fs.existsSync(dataPath)) continue;

      const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      const animeTitle = jsonData.animeTitle;
      const animeCover = jsonData.animeCover;

      for (const [seasonTitle, episodesData] of Object.entries(jsonData.season || {})) {
        for (const [episodeTitle, episodeData] of Object.entries(episodesData)) {
          const name = `${animeTitle} - ${seasonTitle} : ${episodeTitle}`;
          const episodePath = episodeData.videoPath;
          episodes.push({
            name,
            path: episodePath,
            cover: animeCover,
            metadata: {
              animeTitle,
              animeCover,
              seasonTitle,
              episodeTitle,
              videoPath: episodePath,
              downloadedAt: episodeData.downloadedAt,
              state: episodeData.state
            },
            file: episodePath.split(/[\\/]/).pop(),
          });
        }
      }
    }

    return {
      folderPath: userDataFolder,
      episodes
    };
  } catch (error) {
    console.error('Erreur lors de la lecture des données téléchargées :', error);
    return [];
  }
});
ipcMain.handle('delete-episode', async (event, filePath) => {
  try {
    await fs.promises.unlink(filePath);

    const seasonDir = path.dirname(filePath);
    const animeDir = path.dirname(seasonDir);
    const dataJsonPath = path.join(animeDir, 'animeData.json');

    if (fs.existsSync(dataJsonPath)) {
      const data = JSON.parse(await fs.promises.readFile(dataJsonPath, 'utf-8'));

      const seasonName = path.basename(seasonDir);
      const episodeName = path.basename(filePath, path.extname(filePath));

      if (data.season?.[seasonName]?.[episodeName]) {
        delete data.season[seasonName][episodeName];
        if (Object.keys(data.season[seasonName]).length === 0) {
          delete data.season[seasonName];
        }
        await fs.promises.writeFile(dataJsonPath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Mise à jour de animeData.json : ${episodeName} supprimé`);
      }
    }

    const seasonFiles = await fs.promises.readdir(seasonDir);
    if (seasonFiles.length === 0) {
      await fs.promises.rmdir(seasonDir);
      console.log(`Dossier saison supprimé: ${seasonDir}`);

      const animeFiles = await fs.promises.readdir(animeDir);
      if (animeFiles.length === 2 && animeFiles.includes('cover.jpg') && animeFiles.includes('animeData.json')) {
        for (const file of animeFiles) {
          await fs.promises.unlink(path.join(animeDir, file));
          console.log(`Fichier supprimé: ${file}`);
        }
        await fs.promises.rmdir(animeDir);
        console.log(`Dossier anime supprimé: ${animeDir}`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw error;
  }
});
ipcMain.handle('export-data', async () => {
  const baseFolder = path.join(app.getPath('appData'), 'erebus-empire', 'userData');
  const zip = new JSZip();
  const addFilesToZip = (dirPath, zipFolder) => {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        const folder = zipFolder.folder(file);
        addFilesToZip(filePath, folder);
      } else {
        zipFolder.file(file, fs.readFileSync(filePath));
      }
    });
  };
  if (fs.existsSync(baseFolder)) {
    addFilesToZip(baseFolder, zip); 
    const { filePath } = await dialog.showSaveDialog({
      title: 'Exporter les données',
      defaultPath: 'erebus_data.zip',
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
    });

    if (filePath) {
      const zipData = await zip.generateAsync({ type: 'nodebuffer' });
      fs.writeFileSync(filePath, zipData);
      return filePath;  
    }
  } else {
    console.error('Le dossier de données utilisateur n\'existe pas :', baseFolder);
    return null; 
  }

  return null;
});
ipcMain.handle('import-data', async (event) => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
  });
  if (filePaths.length === 0) {
    return 'Aucun fichier sélectionné';
  }

  const filePath = filePaths[0]; 

  try {
    const zip = new JSZip();
    const fileData = fs.readFileSync(filePath);
    const zipContents = await zip.loadAsync(fileData);
    if (Object.keys(zipContents.files).length === 0) {
      return 'Le fichier zip est vide';
    }
    const baseFolder = path.join(app.getPath('appData'), 'erebus-empire', 'userData');
    if (fs.existsSync(baseFolder)) {
      fs.rmSync(baseFolder, { recursive: true, force: true });  
    }
    fs.mkdirSync(baseFolder, { recursive: true });
    for (const fileName of Object.keys(zipContents.files)) {
      const zipEntry = zipContents.files[fileName];
      if (zipEntry.dir) {
        continue;
      }

      const fileData = await zipEntry.async('nodebuffer');
      const relativePathParts = fileName.split(path.posix.sep);
const trimmedPath = relativePathParts.slice(1).join(path.sep);
const targetFilePath = path.join(baseFolder, trimmedPath);
      const dirPath = path.dirname(targetFilePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(targetFilePath, fileData);
    }

    return 'Données importées avec succès';

  } catch (error) {
    console.error('Erreur lors de l\'importation du fichier zip:', error);
    return 'Erreur lors de l\'importation. Assurez-vous que le fichier est un zip valide.';
  }
});


  createWindow()
  // mainWindow.webContents.openDevTools(); // Force l'ouverture des DevTools

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
