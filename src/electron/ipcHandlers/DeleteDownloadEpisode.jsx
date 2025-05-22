import { ipcMain, app} from 'electron';
import path from 'path';
import fs from 'fs';

function DeleteDownloadEpisode() {
  ipcMain.handle('delete-episode', async (event, filePath) => {
    try {
      await fs.promises.unlink(filePath);

      const seasonDir = path.dirname(filePath);
      const animeDir = path.dirname(seasonDir);
      const dataJsonPath = path.join(animeDir, 'animeData.json');

      if (fs.existsSync(dataJsonPath)) {
        const data = JSON.parse(await fs.promises.readFile(dataJsonPath, 'utf-8'));

        const seasonName = path.basename(seasonDir);
        const episodeName = path.basename(filePath, path.extname(filePath));

        if (data.season?.[seasonName]?.[episodeName]) {
          delete data.season[seasonName][episodeName];
          if (Object.keys(data.season[seasonName]).length === 0) {
            delete data.season[seasonName];
          }
          await fs.promises.writeFile(dataJsonPath, JSON.stringify(data, null, 2), 'utf-8');
          console.log(`Mise à jour de animeData.json : ${episodeName} supprimé`);
        }
      }

      const seasonFiles = await fs.promises.readdir(seasonDir);
      if (seasonFiles.length === 0) {
        await fs.promises.rmdir(seasonDir);
        console.log(`Dossier saison supprimé: ${seasonDir}`);

        const animeFiles = await fs.promises.readdir(animeDir);
        if (animeFiles.length === 2 && animeFiles.includes('cover.jpg') && animeFiles.includes('animeData.json')) {
          for (const file of animeFiles) {
            await fs.promises.unlink(path.join(animeDir, file));
            console.log(`Fichier supprimé: ${file}`);
          }
          await fs.promises.rmdir(animeDir);
          console.log(`Dossier anime supprimé: ${animeDir}`);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  });
}

export { DeleteDownloadEpisode };
