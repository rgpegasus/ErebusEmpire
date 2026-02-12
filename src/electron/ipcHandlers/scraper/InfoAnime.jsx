import { ipcMain } from 'electron';

function InfoAnime(scraper) {
  ipcMain.handle("info-anime", async (event, animeUrl) => {
    try {
      return await scraper.getAnimeInfo(animeUrl)
    } catch (error) {
      console.error("Erreur dans le main process:", error)
      return {}
    }
  })
}

export { InfoAnime };
