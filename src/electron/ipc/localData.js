import { ipcMain, app, dialog } from "electron"
import fs from "fs"
import path from "path"
import JSZip from "jszip"

export const userDataRoot = () => path.join(app.getPath("appData"), "Erebus Empire", "userData")
const animeDir = () => path.join(userDataRoot(), "localStorage", "anime")

const COLLECTIONS = new Set([
  "animeAlreadySeen", "animeFavorites", "animeOnHold",
  "animeWatchHistory", "animeWatchlist", "notifiedEpisodes",
])
const assertCollection = (c) => {
  if (!COLLECTIONS.has(c)) throw new Error(`Collection inconnue : ${c}`)
}
const fileOf = (c) => path.join(animeDir(), `${c}.json`)
const seasonPrefix = (key) => key.split("/").slice(0, -1).join("/") + "/"

const queues = new Map()
const enqueue = (c, job) => {
  const next = (queues.get(c) ?? Promise.resolve()).then(job, job)
  queues.set(c, next.catch(() => {}))
  return next
}

async function read(c) {
  try {
    const parsed = JSON.parse(await fs.promises.readFile(fileOf(c), "utf-8"))
    return Array.isArray(parsed)
      ? Object.fromEntries(parsed.map((n) => [`${n.title}|${n.episode}|${n.language}`, n]))
      : parsed
  } catch (e) {
    if (e.code === "ENOENT") return {}
    console.error(`[localData] lecture ${c} :`, e)
    return {}
  }
}

async function write(c, data) {
  await fs.promises.mkdir(animeDir(), { recursive: true })
  const tmp = `${fileOf(c)}.${process.pid}.tmp`
  await fs.promises.writeFile(tmp, JSON.stringify(data), "utf-8")
  await fs.promises.rename(tmp, fileOf(c))
}

export function registerLocalData() {
  ipcMain.handle("local:load", async (_e, c, key) => (assertCollection(c), (await read(c))[key] ?? null))
  ipcMain.handle("local:loadAll", async (_e, c) => (assertCollection(c), read(c)))
  ipcMain.handle("local:save", (_e, c, key, value) => {
    assertCollection(c)
    return enqueue(c, async () => {
      const data = await read(c)
      data[key] = value
      await write(c, data)
      return true
    })
  })
  ipcMain.handle("local:remove", (_e, c, key) => {
    assertCollection(c)
    return enqueue(c, async () => {
      const data = await read(c)
      delete data[key]
      await write(c, data)
      return true
    })
  })
  ipcMain.handle("local:removeSiblings", (_e, c, key) => {
    assertCollection(c)
    return enqueue(c, async () => {
      const data = await read(c)
      const prefix = seasonPrefix(key)
      for (const k of Object.keys(data)) if (k !== key && k.startsWith(prefix)) delete data[k]
      await write(c, data)
      return true
    })
  })

  ipcMain.handle("data:export", async () => {
    const root = userDataRoot()
    const zip = new JSZip()
    const add = async (dir, folder) => {
      for (const ent of await fs.promises.readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name)
        if (ent.isDirectory()) await add(p, folder.folder(ent.name))
        else folder.file(ent.name, await fs.promises.readFile(p))
      }
    }
    const dataDir = path.join(root, "localStorage")
    if (!fs.existsSync(dataDir)) return null
    await add(dataDir, zip.folder("localStorage"))
    const { filePath } = await dialog.showSaveDialog({
      title: "Exporter les données",
      defaultPath: "erebus_data.zip",
      filters: [{ name: "ZIP", extensions: ["zip"] }],
    })
    if (!filePath) return null
    await fs.promises.writeFile(filePath, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }))
    return filePath
  })

  ipcMain.handle("data:import", async () => {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "ZIP", extensions: ["zip"] }],
    })
    if (!filePaths?.length) return { success: false, message: "Aucun fichier sélectionné" }
    try {
      const zip = await JSZip.loadAsync(await fs.promises.readFile(filePaths[0]))
      const base = path.join(userDataRoot(), "localStorage")
      let count = 0
      for (const [name, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue
        const m = /(?:^|\/)(?:anime\/)?([A-Za-z]+)\.json$/.exec(name)
        if (!m || !COLLECTIONS.has(m[1])) continue
        JSON.parse(await entry.async("string")) 
        await fs.promises.mkdir(path.join(base, "anime"), { recursive: true })
        await fs.promises.writeFile(fileOf(m[1]), await entry.async("nodebuffer"))
        count++
      }
      return count
        ? { success: true, message: `${count} fichier(s) importé(s)` }
        : { success: false, message: "Aucune donnée Erebus reconnue dans ce ZIP" }
    } catch (e) {
      console.error("[import]", e)
      return { success: false, message: "Fichier invalide" }
    }
  })
}

export { read as readCollection, write as writeCollection, enqueue as enqueueCollection }
