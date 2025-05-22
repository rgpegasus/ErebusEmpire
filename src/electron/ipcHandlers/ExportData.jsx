import { ipcMain, app, dialog} from 'electron';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';

function ExportData() {
  ipcMain.handle('export-data', async () => {
    const baseFolder = path.join(app.getPath('appData'), 'erebus-empire', 'userData');
    const zip = new JSZip();
    const addFilesToZip = (dirPath, zipFolder) => {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          const folder = zipFolder.folder(file);
          addFilesToZip(filePath, folder);
        } else {
          zipFolder.file(file, fs.readFileSync(filePath));
        }
      });
    };
    if (fs.existsSync(baseFolder)) {
      addFilesToZip(baseFolder, zip); 
      const { filePath } = await dialog.showSaveDialog({
        title: 'Exporter les données',
        defaultPath: 'erebus_data.zip',
        filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
      });

      if (filePath) {
        const zipData = await zip.generateAsync({ type: 'nodebuffer' });
        fs.writeFileSync(filePath, zipData);
        return filePath;  
      }
    } else {
      console.error('Le dossier de données utilisateur n\'existe pas :', baseFolder);
      return null; 
    }

    return null;
  });
}

export { ExportData };
