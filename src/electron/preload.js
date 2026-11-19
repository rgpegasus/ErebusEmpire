import { contextBridge, ipcRenderer } from "electron"

const INVOKE = new Set([
  "get-working-url", "search-anime", "random-anime", "info-anime", "get-seasons",
  "get-available-languages", "get-episodes", "get-latest-episode", "get-latest-scans",
  "get-all-anime", "get-scans-chapter", "get-scans-img", "get-url", "resolve-sources",
  "download-video", "cancel-download", "get-downloads", "delete-episode",
  "export-data", "import-data", "get-install-date",
  "local:load", "local:loadAll", "local:save", "local:remove", "local:removeSiblings",
])
const SEND = new Set([
  "update-rich-presence", "scan-discord-presence", "default-rich-presence",
  "open-devtools", "close-devtools",
  "window-minimize", "window-toggle-fullscreen", "window-close",
])
const LISTEN = new Set(["download-progress", "deep-link"])

const guard = (set, channel) => {
  if (!set.has(channel)) throw new Error(`Canal IPC refusé : ${channel}`)
}

contextBridge.exposeInMainWorld("api", {
  invoke: (channel, ...args) => (guard(INVOKE, channel), ipcRenderer.invoke(channel, ...args)),
  send: (channel, ...args) => (guard(SEND, channel), ipcRenderer.send(channel, ...args)),
  on: (channel, callback) => {
    guard(LISTEN, channel)
    const handler = (_event, ...args) => callback(...args)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
  localData: {
    save: (c, k, v) => ipcRenderer.invoke("local:save", c, k, v),
    load: (c, k) => ipcRenderer.invoke("local:load", c, k),
    loadAll: (c) => ipcRenderer.invoke("local:loadAll", c),
    remove: (c, k) => ipcRenderer.invoke("local:remove", c, k),
    removeSiblings: (c, k) => ipcRenderer.invoke("local:removeSiblings", c, k),
  },
  window: {
    minimize: () => ipcRenderer.send("window-minimize"),
    toggleFullScreen: () => ipcRenderer.send("window-toggle-fullscreen"),
    close: () => ipcRenderer.send("window-close"),
  },
})
