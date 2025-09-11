import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

const animeCover = {
  save: (data) => ipcRenderer.invoke('save-anime-temp', data),
  load: () => ipcRenderer.invoke('load-anime-temp'),
};
const animeData = {
  save: (fileKey, storageKey, data) => ipcRenderer.invoke('save-anime-data', fileKey, storageKey, data),
  load: (fileKey, storageKey) => ipcRenderer.invoke('load-anime-data', fileKey, storageKey),
  loadAll: (fileKey) => ipcRenderer.invoke('load-all-anime-data', fileKey),
  delete: (fileKey, storageKey) => ipcRenderer.invoke('delete-anime-data', fileKey, storageKey),
};


const api = {
  ipcRenderer: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, func) => ipcRenderer.on(channel, func),
    removeListener: (channel, func) => ipcRenderer.removeListener(channel, func)
  }
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', { ...electronAPI, ...api });
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('animeCover', animeCover); 
    contextBridge.exposeInMainWorld('animeData', animeData); 
    contextBridge.exposeInMainWorld('electronAPI', {
      minimize: () => ipcRenderer.send('window-minimize'),
      toggleFullScreen: () => ipcRenderer.send('window-toggle-fullscreen'),
      close: () => ipcRenderer.send('window-close')
    });
    contextBridge.exposeInMainWorld('deeplinkAPI', {
      onDeepLink: (callback) => {
        ipcRenderer.on('deep-link', (event, url) => callback(url));
      }
    });

  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = { ...electronAPI, ...api };
  window.api = api;
  window.animeCover = animeCover; 
  window.animeData = animeData; 
  window.electronAPI = {
    minimize: () => ipcRenderer.send('window-minimize'),
    toggleFullScreen: () => ipcRenderer.send('window-toggle-fullscreen'),
    close: () => ipcRenderer.send('window-close')
  };
  window.deeplinkAPI = {
    onDeepLink: (callback) => ipcRenderer.on('deep-link', (event, url) => callback(url))
  };
}
