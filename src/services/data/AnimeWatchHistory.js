import { ipcMain, app } from 'electron';
import fs from 'fs';
import path from 'path';

const baseFolder = path.join(app.getPath('appData'), 'erebus-empire', 'userData', 'anime', 'localStorage');
const filePath = path.join(baseFolder, 'animeWatchHistory.json');

function loadHistory() {
  try {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Erreur lecture animeWatchHistory.json:', error);
    return {};
  }
}
function LoadAllAnimeWatchHistory() {
  return loadHistory(); // renvoie tout
}
function saveHistory(data) {
  fs.mkdirSync(baseFolder, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function SaveAnimeWatchHistory(key, watchData) {
  const history = loadHistory();
  history[key] = watchData;
  saveHistory(history);
}

function LoadAnimeWatchHistory(key) {
  const history = loadHistory();
  return history[key] || null;
}

function DeleteAnimeWatchHistory(key = null) {
  const history = loadHistory();
  if (key) {
    delete history[key];
    const isEmpty = Object.keys(history).length === 0;
    if (isEmpty && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      saveHistory(history);
    }
  } else {
    return false;
  }
  return true;
}


function AnimeWatchHistory() {
  ipcMain.handle('save-watch-history', (event, key, watchData) => {
    SaveAnimeWatchHistory(key, watchData);
    return true;
  });

  ipcMain.handle('load-watch-history', (event, key) => {
    return LoadAnimeWatchHistory(key);
  });
 ipcMain.handle('load-all-watch-history', () => { 
    return LoadAllAnimeWatchHistory();
  });
  ipcMain.handle('delete-watch-history', (event, key) => {
    return DeleteAnimeWatchHistory(key);
  });
}

export { AnimeWatchHistory };
