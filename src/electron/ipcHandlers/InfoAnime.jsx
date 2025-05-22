import { ipcMain } from 'electron';

function InfoAnime(scraper) {
  ipcMain.handle("info-anime", async (event, query)=> {
    try {
      return await scraper.getAnimeInfo(query);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
}

export { InfoAnime };
