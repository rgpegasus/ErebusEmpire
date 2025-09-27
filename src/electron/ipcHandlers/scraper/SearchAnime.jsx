import { ipcMain } from 'electron';

function SearchAnime(scraper) {
  ipcMain.handle('search-anime', async (event, query, limit, page) => {
    try {
      return await scraper.searchAnime(query, limit, [], ["Anime", "Film", "Autre", "Scans"], page);
    } catch (error) {
      console.error('Erreur dans le main process:', error);
      return [];
    }
  });
}

export { SearchAnime };
