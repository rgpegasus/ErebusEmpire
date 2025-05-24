import { ipcMain, app } from 'electron';
import fs from 'fs';
import path from 'path';

function SaveAnimeCoverTemp(animeData) {
  const baseFolder = path.join(app.getPath('appData'), 'erebus-empire', 'userData', 'anime', 'sessionStorage');
  const filePath = path.join(baseFolder, 'animeCover.json');
  fs.mkdirSync(baseFolder, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(animeData, null, 2), 'utf-8');
}

function LoadAnimeCoverTemp() {
  const baseFolder = path.join(app.getPath('appData'), 'erebus-empire', 'userData', 'anime', 'sessionStorage');
  const filePath = path.join(baseFolder, 'animeCover.json');
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent); 
  } catch (error) {
    console.error('Erreur lecture animeCover.json:', error);
    return null;
  }
}


function AnimeCoverTemp() {
  ipcMain.handle('save-anime-temp', (event, animeData) => {
    SaveAnimeCoverTemp(animeData);
    return true;
  });
  ipcMain.handle('load-anime-temp', () => {
    return LoadAnimeCoverTemp();
  });
}


export { AnimeCoverTemp };
