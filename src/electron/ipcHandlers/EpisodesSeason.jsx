import { ipcMain } from 'electron';
import isDev from 'electron-is-dev';
import { join} from 'path';
const chromePath = isDev
  ? join(__dirname, '..', '..', 'puppeteer', 'chrome', 'win64-135.0.7049.95', 'chrome-win64', 'chrome.exe')
  : join(process.resourcesPath, 'app.asar.unpacked', 'puppeteer', 'chrome', 'win64-135.0.7049.95', 'chrome-win64', 'chrome.exe');


function EpisodesSeason(scraper) {
  ipcMain.handle("get-episodes", async (event, query, SeasonInfo = false)=> {
    try {
      return await scraper.getEmbed(query, ["oneupload", "sibnet", "sendvid"], chromePath, SeasonInfo);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
}

export { EpisodesSeason };
