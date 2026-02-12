import { ipcMain } from 'electron';

function ScansImg(scraper) {
  ipcMain.handle(
    "get-scans-img",
    async (event, mangaUrl, wantedChapter, numberImg = null, encodedTitle = null) => {
      try {
        return await scraper.getImgScans(mangaUrl, wantedChapter, numberImg, encodedTitle)
      } catch (error) {
        console.error("Erreur dans le main process:", error)
        return []
      }
    },
  )
}
 
export { ScansImg };
