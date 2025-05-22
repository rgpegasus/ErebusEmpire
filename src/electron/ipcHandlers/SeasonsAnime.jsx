import { ipcMain } from 'electron';

function SeasonsAnime(scraper) {
  ipcMain.handle("get-seasons", async (event, query)=> {
    try {
      return await scraper.getSeasons(query, "vostfr");
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
}

export { SeasonsAnime };
