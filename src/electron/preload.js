import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

const animeCover = {
  save: (data) => ipcRenderer.invoke('save-anime-temp', data),
  load: () => ipcRenderer.invoke('load-anime-temp'),
};
const animeWatchHistory = {
  save: (storageKey, data) => ipcRenderer.invoke('save-watch-history', storageKey, data),
  load: (storageKey) => ipcRenderer.invoke('load-watch-history', storageKey),
  loadAll: () => ipcRenderer.invoke('load-all-watch-history'),
  delete: (storageKey) => ipcRenderer.invoke('delete-watch-history', storageKey),
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
    contextBridge.exposeInMainWorld('animeWatchHistory', animeWatchHistory); 
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = { ...electronAPI, ...api };
  window.api = api;
  window.animeCover = animeCover; 
  window.animeWatchHistory = animeWatchHistory; 
}
