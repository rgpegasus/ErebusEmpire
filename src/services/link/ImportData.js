import { supabase } from "@services/supabase/Client"
import { ipcMain } from "electron"
import { LoadAllAnimeDataFromLocal } from "@services/data/AnimeData"
import { SaveAnimeDataToSupabase, LoadAllAnimeDataFromSupabase } from "@services/supabase/AnimeData"

async function isUserLoggedIn() {
  const { data: userData } = await supabase.auth.getUser()
  return !!userData?.user
}

function ImportDataToSupabase() {
    ipcMain.handle("import-data-to-supabase", async (event) => {
        const loggedIn = await isUserLoggedIn()
        if (loggedIn) {
            for(const fileKey of ["animeAlreadySeen", "animeFavorites", "animeOnHold", "animeWatchHistory", "animeWatchlist"]) {
                const localData = await LoadAllAnimeDataFromLocal(fileKey)
                const supabaseData = await LoadAllAnimeDataFromSupabase(fileKey)
                for(const storageKey in localData) {
                    if(!(storageKey in supabaseData) || (storageKey == "animeWatchHistory" && localData[storageKey].timestamp > supabaseData[storageKey].timestamp)) {
                        SaveAnimeDataToSupabase(fileKey, storageKey, localData[storageKey])
                    }
                }
            }
        } else {
            console.log("User is not connected to supabase")
        }
    })
}

export { ImportDataToSupabase }