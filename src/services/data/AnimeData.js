import { app } from "electron"
import fs from "fs"
import path from "path"

const baseFolder = path.join(
  app.getPath("appData"),
  "Erebus Empire",
  "userData",
  "localStorage",
  "anime",
)

function getFilePath(fileKey) {
  return path.join(baseFolder, `${fileKey}.json`)
}

function loadData(fileKey) {
  try {
    const filePath = getFilePath(fileKey)
    if (!fs.existsSync(filePath)) return {}
    const content = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(content)
  } catch (error) {
    console.error(`Erreur lecture ${fileKey}.json:`, error)
    return {}
  }
}

function LoadAllAnimeDataFromLocal(fileKey) {
  return loadData(fileKey)
}

function saveData(fileKey, data) {
  fs.mkdirSync(baseFolder, { recursive: true })
  const filePath = getFilePath(fileKey)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
}

function SaveAnimeDataToLocal(fileKey, storageKey, animeData) {
  const data = loadData(fileKey)
  data[storageKey] = animeData
  saveData(fileKey, data)
}

function LoadAnimeDataFromLocal(fileKey, storageKey) {
  const data = loadData(fileKey)
  return data[storageKey] || null
}

function DeleteAnimeDataFromLocal(fileKey, storageKey = null) {
  const data = loadData(fileKey)

  if (storageKey) {
    delete data[storageKey]
    const isEmpty = Object.keys(data).length === 0
    const filePath = getFilePath(fileKey)
    if (isEmpty && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    } else {
      saveData(fileKey, data)
    }
  } else {
    return false
  }

  return true
}

export {
  SaveAnimeDataToLocal,
  LoadAnimeDataFromLocal,
  DeleteAnimeDataFromLocal,
  LoadAllAnimeDataFromLocal,
}
