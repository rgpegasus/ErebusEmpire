import { ipcMain, app, dialog} from 'electron';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';

function ImportData() {
  ipcMain.handle('import-data', async (event) => {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'ZIP Files', extensions: ['zip'] }
      ],
    });

    if (!filePaths || filePaths.length === 0) {
      return { success: false, message: 'Aucun fichier sélectionné' };
    }

    const filePath = filePaths[0];
    const ext = path.extname(filePath).toLowerCase();
    const baseFolder = path.join(app.getPath('appData'), 'erebus-empire', 'userData');

    try {
      // Crée le dossier de destination principal s'il n'existe pas
      fs.mkdirSync(baseFolder, { recursive: true });

      // Si c'est un fichier .zip
      if (ext === '.zip') {
        const zip = new JSZip();
        const fileData = fs.readFileSync(filePath);
        const zipContents = await zip.loadAsync(fileData);

        if (Object.keys(zipContents.files).length === 0) {
          return { success: false, message: 'Le fichier zip est vide' };
        }

        let devUnlocked = false;

        for (const fileName of Object.keys(zipContents.files)) {
          const zipEntry = zipContents.files[fileName];
          if (zipEntry.dir) continue;

          const fileData = await zipEntry.async('nodebuffer');

          if (fileName === 'dev/unlock-dev.txt') {
            const devDir = path.join(baseFolder, 'dev');
            fs.mkdirSync(devDir, { recursive: true });
            const targetPath = path.join(devDir, 'unlock-dev.txt');
            fs.writeFileSync(targetPath, fileData);
            devUnlocked = true;
            continue;
          }

          const relativePathParts = fileName.split(path.posix.sep);
          const trimmedPath = relativePathParts.join(path.sep);
          const targetFilePath = path.join(baseFolder, trimmedPath);
          const dirPath = path.dirname(targetFilePath);

          fs.mkdirSync(dirPath, { recursive: true });

          // Si le fichier existe déjà, le remplacer
          fs.writeFileSync(targetFilePath, fileData);
        }

        return {
          success: true,
          message: 'Fichier ZIP importé avec succès',
          devUnlocked
        };
      }

      // Si c'est exactement le fichier "unlock-dev.txt"
      const baseName = path.basename(filePath);
      if (baseName === 'unlock-dev.txt') {
        const devDir = path.join(baseFolder, 'dev');
        fs.mkdirSync(devDir, { recursive: true });
        const targetPath = path.join(devDir, 'unlock-dev.txt');
        fs.copyFileSync(filePath, targetPath);

        return {
          success: true,
          message: 'Fichier spécial unlock-dev.txt importé',
          devUnlocked: true
        };
      }

      // Sinon, fichier générique => dossier 'other'
      const otherDir = path.join(baseFolder, 'other');
      fs.mkdirSync(otherDir, { recursive: true });
      const targetPath = path.join(otherDir, baseName);
      fs.copyFileSync(filePath, targetPath);

      return {
        success: true,
        message: 'Fichier importé dans "other"',
        devUnlocked: false
      };

    } catch (error) {
      console.error('Erreur lors de l\'importation :', error);
      return {
        success: false,
        message: 'Erreur lors de l\'importation. Vérifiez le format du fichier.',
      };
    }
  });
}

export { ImportData };
