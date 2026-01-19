import { ipcMain } from 'electron';

function ScansChapter(scraper) {
  ipcMain.handle("get-scans-chapter", async (event, mangaUrl, numberImg = false)=> {
    try {
      return await scraper.getChapterTitles(mangaUrl, numberImg, true)
    } catch (error){
      console.error('Erreur dans le main process:', error);
      return null;
    }
  });
}
 
export { ScansChapter };
