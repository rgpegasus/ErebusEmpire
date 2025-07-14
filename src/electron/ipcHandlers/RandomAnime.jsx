import { ipcMain } from 'electron';

function RandomAnime(scraper) {
  ipcMain.handle("random-anime", async (event)=> {
    try {
      return await scraper.getRandomAnime(["vostfr", "vf"], ["Anime", "Film"]);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
}

export { RandomAnime };
