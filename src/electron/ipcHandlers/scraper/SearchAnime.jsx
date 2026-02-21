import { ipcMain } from 'electron';

function SearchAnime(scraper) {
  ipcMain.handle('search-anime', async (event, query, limit, wantedPage = 1) => {
    try {
      return await scraper.searchAnime(query, limit, [], [], wantedPage)
    } catch (error) {
      console.error('Erreur dans le main process:', error);
      return [];
    }
  });
}

export { SearchAnime };
