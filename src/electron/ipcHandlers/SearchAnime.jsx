import { ipcMain } from 'electron';

function SearchAnime(scraper) {
  ipcMain.handle('search-anime', async (event, query, limit, page) => {
    try {
      return await scraper.searchAnime(query, limit, ["vostfr"], ["Anime", "Film"], page);
    } catch (error) {
      console.error('Erreur dans le main process:', error);
      return [];
    }
  });
}

export { SearchAnime };
