import { ipcMain } from 'electron';

function CatalogAnime(scraper) {
  ipcMain.handle("get-all-anime", async (event, page = null)=> {
    try {
      return await scraper.getAllAnime(["vostfr"], ["Anime", "Film"], page);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
}

export { CatalogAnime };
