import { ipcMain } from 'electron';
import { getVideoUrlFromEmbed} from 'better-ani-scraped';

function UrlEpisode(scraper) {
  ipcMain.handle("get-url", async (event, query, host)=> {
     try {
      return await getVideoUrlFromEmbed(host, query);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
}

export { UrlEpisode };
