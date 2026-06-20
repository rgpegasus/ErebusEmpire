import { ipcMain } from 'electron';
import isDev from 'electron-is-dev';
import { join} from 'path';



function EpisodesSeason(scraper) {
  ipcMain.handle("get-episodes", async (event, seasonUrl, allHost = false, includeInfo = false) => {
    try {
      return await scraper.getEmbed(
        seasonUrl,
        ["vidmoly", "sibnet", "sendvid", "smoothpre", "embed4me"],
        allHost,
        includeInfo,
      )
    } catch (error) {
      console.error("Erreur dans le main process:", error)
      if (includeInfo) {
        return {}
      } else {
        return []
      }
      
    }
  })
}

export { EpisodesSeason };
