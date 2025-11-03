import fs from 'fs';
import path from 'path';

const baseFolder = path.join(process.env.APPDATA, 'Erebus Empire', 'userData', 'localStorage', 'anime');

function getFilePath(fileKey) {
  return path.join(baseFolder, `${fileKey}.json`);
}

function loadAll(fileKey) {
  try {
    const filePath = getFilePath(fileKey);
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`[Erebus] Erreur lecture ${fileKey}.json:`, err);
    return [];
  }
}


function save(fileKey, data) {
  try {
    fs.mkdirSync(baseFolder, { recursive: true });
    const filePath = getFilePath(fileKey);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Erebus] Erreur sauvegarde brute ${fileKey}.json:`, err);
  }
}

export const animeData = {
  loadAll,
  save
};
