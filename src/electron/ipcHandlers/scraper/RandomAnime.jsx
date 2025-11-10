import { ipcMain } from "electron"

function RandomAnime(scraper) {
  ipcMain.handle("random-anime", async (event, max) => {
    try {
      return await scraper.getRandomAnime(["vostfr", "vf"], ["Anime", "Film"], max)
    } catch (error) {
      console.error("Erreur dans le main process:", error)
      return null
    }
  })
}

export { RandomAnime }
