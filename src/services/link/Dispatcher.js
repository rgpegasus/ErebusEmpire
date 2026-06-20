import { supabase } from "@services/supabase/Client"
import { ipcMain } from "electron"
import { SaveAnimeDataToLocal, LoadAnimeDataFromLocal, LoadAllAnimeDataFromLocal, DeleteAnimeDataFromLocal } from "@services/data/AnimeData"
import { SaveAnimeDataToSupabase, LoadAnimeDataFromSupabase, LoadAllAnimeDataFromSupabase, DeleteAnimeDataFromSupabase } from "@services/supabase/AnimeData"

async function isUserLoggedIn() {
  const { data: userData } = await supabase.auth.getUser()
  return !!userData?.user
}

function AnimeData() {
  ipcMain.handle("save-anime-data", async (event, fileKey, storageKey, data) => {
    const loggedIn = await isUserLoggedIn()

    if (loggedIn) {
      return SaveAnimeDataToSupabase(fileKey, storageKey, data)
    } else {
      return SaveAnimeDataToLocal(fileKey, storageKey, data)
    }
  })

  ipcMain.handle("load-anime-data", async (event, fileKey, storageKey) => {
    const loggedIn = await isUserLoggedIn()

    if (loggedIn) {
      return LoadAnimeDataFromSupabase(fileKey, storageKey)
    } else {
      return LoadAnimeDataFromLocal(fileKey, storageKey)
    }
  })

  ipcMain.handle("load-all-anime-data", async (event, fileKey) => {
    const loggedIn = await isUserLoggedIn()

    if (loggedIn) {
      return LoadAllAnimeDataFromSupabase(fileKey)
    } else {
      return LoadAllAnimeDataFromLocal(fileKey)
    }
  })

  ipcMain.handle("delete-anime-data", async (event, fileKey, storageKey) => {
    const loggedIn = await isUserLoggedIn()

    if (loggedIn) {
      return DeleteAnimeDataFromSupabase(fileKey, storageKey)
    } else {
      return DeleteAnimeDataFromLocal(fileKey, storageKey)
    }
  })
}

export { AnimeData }