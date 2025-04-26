import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join, resolve} from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/pictures/logo_app_only.png';
import {AnimeScraper, getVideoUrlFromEmbed} from 'better-ani-scraped';
import { exec } from 'child_process';
import fs from 'fs';
import isDev from 'electron-is-dev';


const scraper = new AnimeScraper("animesama");
const logFolderPath = join(app.getPath('userData'), 'logs');
import path from 'path';

const chromePath = isDev
  ? join(__dirname, '..', '..', 'puppeteer', 'chrome', 'win64-135.0.7049.95', 'chrome-win64', 'chrome.exe')
  : join(process.resourcesPath, 'app.asar.unpacked', 'puppeteer', 'chrome', 'win64-135.0.7049.95', 'chrome-win64', 'chrome.exe');

console.log(chromePath); 
if (!fs.existsSync(logFolderPath)) {
  fs.mkdirSync(logFolderPath, { recursive: true });
}
const logFilePath = join(logFolderPath, 'app.log');

fs.appendFileSync(logFilePath, `Log de l'application - ${new Date().toISOString()}\n`);

const logToFile = (...messages) => {
  const timestamp = new Date().toISOString();

  const formatted = messages.map(msg => {
    return typeof msg === 'object'
      ? JSON.stringify(msg, null, 2)
      : msg;
  }).join(' ');

  console.log(`[${timestamp}] ${formatted}\n`);
  fs.appendFileSync(logFilePath, `[${timestamp}] ${formatted}\n`);
};


let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
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

// Désactive la sécurité web pour éviter les CORS ou autres protections
app.commandLine.appendSwitch("disable-web-security");
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  

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
      logToFile("URL de la saison:", query)
      
      return await scraper.getEmbed(query, ["sibnet","vidmoly"], chromePath);
       
      // return await scraper.getEmbed(query, ["vidmoly", "sibnet"]);
      // return await scraper.getEmbed(query, ["senvid", "vidmoly", "sibnet"]);
    } catch (error){
      logToFile('Erreur dans le main process:', error)
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
      return await scraper.getLatestEpisodes(["vostfr"]); 
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
  ipcMain.handle('download-video', async (event, videoUrl, metaData) => {
    const { episodeTitle, seasonTitle, animeTitle, animeCover } = metaData;
  
    const ytDlpPath = isDev
      ? join(__dirname, '..', '..', 'resources', 'bin', 'yt-dlp.exe')
      : join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'bin', 'yt-dlp.exe');
  
    const userDownloadFolder = join(app.getPath('videos'), 'Erebus Empire');
    const animeFolder = join(userDownloadFolder, animeTitle);
    const seasonFolder = join(animeFolder, seasonTitle);
    const episodePath = join(seasonFolder, `${episodeTitle}.mp4`);
    const coverPath = join(animeFolder, 'cover.jpg');
    const dataJsonPath = join(animeFolder, 'data.json');
  
    [userDownloadFolder, animeFolder, seasonFolder].forEach((f) => {
      if (!fs.existsSync(f)) fs.mkdirSync(f, { recursive: true });
    });
    if (!fs.existsSync(coverPath)) {
      try {
        const res = await fetch(animeCover);
        const buf = await res.arrayBuffer();
        fs.writeFileSync(coverPath, Buffer.from(buf));
      } catch (err) {
        logToFile(`Erreur cover: ${err}`);
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
    logToFile(`[yt-dlp command] ${command}`);
  
    return new Promise((resolve, reject) => {
      const downloadProcess = exec(command, (error, stdout, stderr) => {
        if (error) {
          logToFile(`Erreur téléchargement : ${stderr}`);
          return reject(stderr);
        }
        const updated = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
        updated.season[seasonTitle][episodeTitle].downloadedAt = new Date().toISOString();
        updated.season[seasonTitle][episodeTitle].state = "downloaded";
        fs.writeFileSync(dataJsonPath, JSON.stringify(updated, null, 2));
  
        logToFile(`Téléchargement OK : ${episodeTitle}`);
        resolve(stdout);
      });
  
      downloadProcess.stdout.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/\[download\]\s+(\d+(?:\.\d+)?)%.*?ETA (\d+:\d+)/);
        const mainWindow = BrowserWindow.getAllWindows()[0]; // ✅ accès direct à la fenêtre
      
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
      downloadProcess.stderr.on('data', (data) => {
        logToFile(`stderr: ${data}`);
      });
    });
  });
  ipcMain.handle('get-downloads', async () => {
    const userDownloadFolder = join(app.getPath('videos'), 'Erebus Empire');
    try {
      const animeFolders = fs.readdirSync(userDownloadFolder)
        .map(name => join(userDownloadFolder, name))
        .filter(path => fs.lstatSync(path).isDirectory());
  
      const episodes = [];
  
      for (const animeFolder of animeFolders) {
        const dataPath = join(animeFolder, 'data.json');
        if (!fs.existsSync(dataPath)) continue;
  
        const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
        const animeTitle = jsonData.animeTitle;
        const animeCover = jsonData.animeCover;
  
        for (const [seasonTitle, episodesData] of Object.entries(jsonData.season || {})) {
          for (const [episodeTitle, episodeData] of Object.entries(episodesData)) {
            const name = `${animeTitle} - ${seasonTitle} : ${episodeTitle}`;
            const path = episodeData.videoPath;
  
            episodes.push({
              name,
              path,
              cover: animeCover,
              metadata: {
                animeTitle,
                animeCover,
                seasonTitle,
                episodeTitle,
                videoPath: path,
                downloadedAt: episodeData.downloadedAt,
                state:episodeData.state
              },
              file: path.split(/[\\/]/).pop(), // juste le nom du fichier mp4
            });
          }
        }
      }
  
      return {
        folderPath: userDownloadFolder,
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

    // Trouver les chemins
    const seasonDir = path.dirname(filePath);
    const animeDir = path.dirname(seasonDir);
    const dataJsonPath = path.join(animeDir, 'data.json');

    // Modifier data.json
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
        console.log(`Mise à jour de data.json : ${episodeName} supprimé`);
      } else {
        console.warn(`Épisode ${episodeName} non trouvé dans data.json`);
      }
    } else {
      console.warn(`data.json introuvable pour ${animeDir}`);
    }


    const seasonFiles = await fs.promises.readdir(seasonDir);
    if (seasonFiles.length === 0) {
      await fs.promises.rmdir(seasonDir);
      console.log(`Dossier saison supprimé: ${seasonDir}`);
      const animeFiles = await fs.promises.readdir(animeDir);
      if (animeFiles.length === 2 && animeFiles.includes('cover.jpg') && animeFiles.includes('data.json')) {
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
