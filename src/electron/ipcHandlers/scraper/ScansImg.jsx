import { ipcMain } from 'electron';

function ScansImg(scraper) {
  ipcMain.handle("get-scans-img", async (event, mangaUrl, wantedChapter)=> {
    try {
      return await scraper.getImgScans(mangaUrl, wantedChapter)
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
}
 
export { ScansImg };
