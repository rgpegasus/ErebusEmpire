import { ipcMain, app} from 'electron';
import path from 'path';
import fs from 'fs';
const userDataFolder = path.join(app.getPath('appData'), 'erebus-empire', 'userData', 'animeDownload');

function DownloadList() {
  ipcMain.handle('get-downloads', async (event) => {
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
}

export { DownloadList };
