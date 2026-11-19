import { ipcMain } from "electron"
import { Client } from "@xhayper/discord-rpc"

const CLIENT_ID = "1366193765701783604"
const BUTTONS = [
  { label: "Discord", url: "https://discord.gg/Mj9cYRQTcU" },
  { label: "Installer", url: "https://github.com/rgpegasus/ErebusEmpire/releases/latest" },
]

const rpc = new Client({ transport: { type: "ipc" }, clientId: CLIENT_ID })
let ready = false
let appStart = new Date()

rpc.on("ready", () => { ready = true; setDefault() })
rpc.on("disconnected", () => { ready = false })

const set = (activity) => {
  if (!ready || !rpc.user) return
  rpc.user.setActivity({ instance: false, type: 3, largeImageText: "Erebus Empire", buttons: BUTTONS, ...activity })
    .catch((e) => console.warn("[presence]", e.message))
}
const setDefault = () =>
  set({ details: "Dans la liste d'animés", state: "Sur Erebus Empire", startTimestamp: appStart, largeImageKey: "icon" })

export function initPresence() {
  const connect = () => rpc.login().catch(() => setTimeout(connect, 30_000))
  connect()

  ipcMain.on("update-rich-presence", (_e, { anime, episode, cover, startTimestamp, endTimestamp }) =>
    set({
      details: `Regarde ${anime}`, state: String(episode),
      startTimestamp: startTimestamp ? new Date(startTimestamp) : new Date(),
      endTimestamp: endTimestamp ? new Date(endTimestamp) : undefined,
      largeImageKey: String(cover), largeImageText: String(anime),
    }))
  ipcMain.on("scan-discord-presence", (_e, { anime, episode, cover }) =>
    set({ details: `Lit ${anime}`, state: String(episode), largeImageKey: String(cover), largeImageText: String(anime) }))
  ipcMain.on("default-rich-presence", setDefault)
}
