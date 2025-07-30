import { ipcMain, app } from 'electron';
import fs from 'fs';
import path from 'path';

const baseFolder = path.join(app.getPath('appData'), 'erebus-empire', 'userData', 'anime', 'localStorage');

function getFilePath(fileKey) {
  return path.join(baseFolder, `${fileKey}.json`);
}

function loadData(fileKey) {
  try {
    const filePath = getFilePath(fileKey);
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Erreur lecture ${fileKey}.json:`, error);
    return {};
  }
}

function LoadAllAnimeData(fileKey) {
  return loadData(fileKey);
}

function saveData(fileKey, data) {
  fs.mkdirSync(baseFolder, { recursive: true });
  const filePath = getFilePath(fileKey);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function SaveAnimeData(fileKey, key, animeData) {
  const data = loadData(fileKey);
  data[key] = animeData;
  saveData(fileKey, data);
}

function LoadAnimeData(fileKey, key) {
  const data = loadData(fileKey);
  return data[key] || null;
}

function DeleteAnimeData(fileKey, key = null) {
  const data = loadData(fileKey);

  if (key) {
    delete data[key];
    const isEmpty = Object.keys(data).length === 0;
    const filePath = getFilePath(fileKey);
    if (isEmpty && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      saveData(fileKey, data);
    }
  } else {
    return false;
  }

  return true;
}

function AnimeData() {
  ipcMain.handle('save-anime-data', (event, fileKey, storageKey, data) => {
    SaveAnimeData(fileKey, storageKey, data);
    return true;
  });

  ipcMain.handle('load-anime-data', (event, fileKey, storageKey) => {
    return LoadAnimeData(fileKey, storageKey);
  });

  ipcMain.handle('load-all-anime-data', (event, fileKey) => {
    return LoadAllAnimeData(fileKey);
  });

  ipcMain.handle('delete-anime-data', (event, fileKey, storageKey) => {
    return DeleteAnimeData(fileKey, storageKey);
  });
}

export { AnimeData };
