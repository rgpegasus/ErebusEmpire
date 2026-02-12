import { ipcMain } from 'electron';

function ScansChapter(scraper) {
  ipcMain.handle(
    "get-scans-chapter",
    async (event, mangaUrl, includeNumberImg = true, includeEncodedTitle = true) => {
      try {
        return await scraper.getChapterTitles(mangaUrl, includeNumberImg, includeEncodedTitle)
      } catch (error) {
        console.error("Erreur dans le main process:", error)
        if (includeEncodedTitle) {
          return {}
        } else {
          return []
        }
      }
    },
  )
}
 
export { ScansChapter };
