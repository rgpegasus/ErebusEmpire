import { ipcMain } from 'electron';

function AvailableLanguages(scraper) { 
  ipcMain.handle("get-available-languages", async (event, seasonUrl)=> {
    try {
      return await scraper.getAvailableLanguages(seasonUrl, ["vostfr", "vf"], false);
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return [];
    }
  });
}

export { AvailableLanguages };
