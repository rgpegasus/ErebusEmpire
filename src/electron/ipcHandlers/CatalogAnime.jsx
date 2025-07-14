import { ipcMain } from 'electron';

function CatalogAnime(scraper) {
  ipcMain.handle("get-all-anime", async (event, page = null)=> {
    try {
      return await scraper.getAllAnime(["vostfr", "vf"], ["Anime", "Film", "Autre"], page);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
}

export { CatalogAnime };
