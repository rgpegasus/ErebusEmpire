import { ipcMain } from 'electron';

function SeasonsAnime(scraper) {
  ipcMain.handle("get-seasons", async (event, animeUrl)=> {
    try {
      return await scraper.getSeasons(animeUrl, [], ["Anime", "Scans"])
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return [];
    }
  });
}
 
export { SeasonsAnime };
