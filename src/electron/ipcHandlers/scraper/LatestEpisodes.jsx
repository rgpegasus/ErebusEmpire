import { ipcMain } from "electron"

function LatestEpisodes(scraper) {
  ipcMain.handle("get-latest-episode", async (event) => {
    try {
      return await scraper.getLatestEpisodes(["vostfr", "vf", "va"])
    } catch (error) {
      console.error("Erreur dans le main process:", error)
      return []
    }
  })
}

export { LatestEpisodes }
