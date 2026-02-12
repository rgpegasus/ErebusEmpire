import { ipcMain } from 'electron';

function SearchAnime(scraper) {
  ipcMain.handle('search-anime', async (event, query, limit) => {
    try {
      return await scraper.searchAnime(query, limit, [], [])
    } catch (error) {
      console.error('Erreur dans le main process:', error);
      return [];
    }
  });
}

export { SearchAnime };
