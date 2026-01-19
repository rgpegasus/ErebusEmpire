import { ipcMain } from 'electron';

function WorkingUrl(scraper) {
  ipcMain.handle("get-working-url", async (event) => {
    try {
      return await scraper.getWorkingUrl()
    } catch (error) {
      console.error("Erreur dans le main process:", error)
      return null
    }
  })
}
 
export { WorkingUrl }
