import { ipcMain, app} from 'electron';
import isDev from 'electron-is-dev';
import { join } from 'path';
import { BrowserWindow } from 'electron';
import fs from 'fs';
import { exec } from 'child_process';
import { SanitizeName } from '@utils/functions/SanitizeName'
const userDataFolder = join(app.getPath('appData'), 'Erebus Empire', 'userData', 'animeDownload');

function DownloadEpisode() {
  ipcMain.handle('download-video', async (event, videoUrl, metaData) => {
    const { episodeTitle, seasonTitle, animeTitle, animeCover } = metaData;
  
    const ytDlpPath = isDev
      ? join(__dirname, '..', '..', 'resources', 'bin', 'yt-dlp.exe')
      : join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'bin', 'yt-dlp.exe');

    const animeFolder = join(userDataFolder,  SanitizeName(animeTitle));
    const seasonFolder = join(animeFolder,  SanitizeName(seasonTitle));
    const episodePath = join(seasonFolder, `${SanitizeName(episodeTitle)}.mp4`);
    const coverPath = join(animeFolder, 'cover.jpg');
    const dataJsonPath = join(animeFolder, 'animeData.json');
  
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
  
    const command = `"${ytDlpPath}" --downloader ffmpeg --hls-use-mpegts -o "${seasonFolder}/%(title)s.%(ext)s" --merge-output-format mp4 "${videoUrl}"`;


  
    return new Promise((resolve, reject) => {
      const downloadProcess = exec(command, (error, stdout, stderr) => {
        if (error) {
          return reject(stderr);
        }
        const files = fs.readdirSync(seasonFolder);
        const downloadedFilePath = files
          .map(f => join(seasonFolder, f))
          .find(f => f.endsWith(".mp4")); 
        if (downloadedFilePath && downloadedFilePath !== episodePath) {
          fs.renameSync(downloadedFilePath, episodePath);
        }
        const updated = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
        updated.season[seasonTitle][episodeTitle].downloadedAt = new Date().toISOString();
        updated.season[seasonTitle][episodeTitle].state = "downloaded";
        fs.writeFileSync(dataJsonPath, JSON.stringify(updated, null, 2));
        resolve(stdout);
      });
  
      downloadProcess.stdout.on('data', (data) => {
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
      downloadProcess.stderr.on('data', (data) => {
      });
    });
  });
}

export { DownloadEpisode };
