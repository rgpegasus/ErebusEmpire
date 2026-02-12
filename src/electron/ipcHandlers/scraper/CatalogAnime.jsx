import { ipcMain } from "electron"

function CatalogAnime(scraper) {
  ipcMain.handle("get-all-anime", async (event, page = 0) => {
    try {
      return await scraper.getAllAnime([], [], page)
    } catch (error) {
      console.error("Erreur dans le main process:", error)
      return []
    }
  })
}

export { CatalogAnime }
