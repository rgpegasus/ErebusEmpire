import { ipcMain } from "electron"

function LatestScans(scraper) {
  ipcMain.handle("get-latest-scans", async (event) => {
    try {
      return await scraper.getLatestScans(["vostfr", "vf", "va"])
    } catch (error) {
      console.error("Erreur dans le main process:", error)
      return []
    }
  })
}

export { LatestScans }
