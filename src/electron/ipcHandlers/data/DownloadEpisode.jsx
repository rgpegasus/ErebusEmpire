import { ipcMain, app, BrowserWindow } from 'electron';
import isDev from 'electron-is-dev';
import { join } from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { sanitizeName } from '@utils/functions/sanitizeName';

const userDataFolder = join(app.getPath('appData'), 'Erebus Empire', 'userData','localStorage', 'animeDownload');

function DownloadEpisode() {
  ipcMain.handle('download-video', async (event, videoUrl, metaData) => {
    const { episodeTitle, seasonTitle, animeTitle, animeCover } = metaData;
    const ytDlpPath = isDev
      ? join(__dirname, '..', '..', 'resources', 'bin', 'yt-dlp.exe')
      : join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'bin', 'yt-dlp.exe');

    const ffmpegPath = isDev
      ? join(__dirname, '..', '..', 'resources', 'bin', 'ffmpeg.exe')
      : join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'bin', 'ffmpeg.exe');

    const animeFolder = join(userDataFolder, sanitizeName(animeTitle));
    const seasonFolder = join(animeFolder, sanitizeName(seasonTitle));
    const episodePath = join(seasonFolder, `${sanitizeName(episodeTitle)}.mp4`);
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
        console.warn("Impossible de télécharger la cover :", err);
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
      state: 'downloading'
    };
    fs.writeFileSync(dataJsonPath, JSON.stringify(animeData, null, 2));

  const command = `"${ytDlpPath}" \
  --ffmpeg-location "${ffmpegPath}" \
  --force-overwrites \
  --no-part \
  -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4" \
  --merge-output-format mp4 \
  -o "${seasonFolder}/%(title)s.%(ext)s" \
  "${videoUrl}"`;

    return new Promise((resolve, reject) => {
      const downloadProcess = exec(command, (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(stderr || error.message));
        }

        const files = fs.readdirSync(seasonFolder);
        const downloadedFilePath = files
          .map(f => join(seasonFolder, f))
          .find(f => f.endsWith('.mp4'));

        if (downloadedFilePath && downloadedFilePath !== episodePath) {
          fs.renameSync(downloadedFilePath, episodePath);
        }

        const updated = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
        updated.season[seasonTitle][episodeTitle].downloadedAt = new Date().toISOString();
        updated.season[seasonTitle][episodeTitle].state = 'downloaded';
        fs.writeFileSync(dataJsonPath, JSON.stringify(updated, null, 2));

        resolve('ok');
      });

      downloadProcess.stdout.on('data', (data) => {
        const output = data.toString();
        const mainWindow = BrowserWindow.getAllWindows()[0];

        const match = output.match(/\[download\]\s+(\d+(?:\.\d+)?)%.*?ETA (\d+:\d+)/);
        if (match && mainWindow) {
          mainWindow.webContents.send('download-progress', {
            animeTitle,
            seasonTitle,
            episodeTitle,
            percent: parseFloat(match[1]),
            eta: match[2],
            videoUrl
          });
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

      downloadProcess.stderr.on('data', () => {});
    });
  });
}

export { DownloadEpisode };
