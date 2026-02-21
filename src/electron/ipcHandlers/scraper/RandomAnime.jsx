import { ipcMain } from "electron"

function RandomAnime(scraper) {
  ipcMain.handle("random-anime", async (event, maxAttempts=null) => {
    try {
      return await scraper.getRandomAnime([], ["Anime", "Film", "Scans"], maxAttempts)
    } catch (error) {
      console.error("Erreur dans le main process:", error)
      return {}
    }
  })
}

export { RandomAnime }
