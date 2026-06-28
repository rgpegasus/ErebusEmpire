import { supabase } from "@services/supabase/Client"
import { LoadAllAnimeDataFromLocal } from "@services/data/AnimeData"

async function SaveAnimeDataToSupabase(fileKey, storageKey, data) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user)
      throw new Error(userError?.message || "Utilisateur non connecté")
    const id = userData.user.id
    const { data: existing, error: selectError } = await supabase
      .from(fileKey)
      .select("*")
      .eq("id", id)
      .eq("storageKey", storageKey)
      .single()
    if (selectError && selectError.code !== "PGRST116") throw selectError
    if (existing) {
      const { error: updateError } = await supabase
        .from(fileKey)
        .update({ data })
        .eq("id", id)
        .eq("storageKey", storageKey)
      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase.from(fileKey).insert({ id, data, storageKey })
      if (insertError) throw insertError
    }
    return true
  } catch (err) {
    console.error(`Erreur save-anime-data (${fileKey}):`, err)
    throw new Error(err.message || JSON.stringify(err))
  }
}

async function LoadAnimeDataFromSupabase(fileKey, storageKey) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user)
      throw new Error(userError?.message || "Utilisateur non connecté")
    const id = userData.user.id
    const { data: row, error: selectError } = await supabase
      .from(fileKey)
      .select("*")
      .eq("id", id)
      .eq("storageKey", storageKey)
      .single()
    if (selectError && selectError.code === "PGRST116") return null
    if (selectError) throw selectError
    return row.data
  } catch (err) {
    console.error(`Erreur load-anime-data (${fileKey}):`, err)
    throw new Error(err.message || JSON.stringify(err))
  }
}

async function DeleteAnimeDataFromSupabase(fileKey, storageKey, isSame = false) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user)
      throw new Error(userError?.message || "Utilisateur non connecté")
    const id = userData.user.id

    let query
    if (!isSame) {
      query = supabase.from(fileKey).delete().eq("id", id).eq("storageKey", storageKey)
    } else {
      const seasonPattern = storageKey.split("/").slice(0, -1).join("/") + "/%"
      query = supabase
        .from(fileKey)
        .delete()
        .eq("id", id)
        .like("storageKey", seasonPattern)
        .neq("storageKey", storageKey)
    }

    const { error } = await query
    if (error) throw error
    return true
  } catch (err) {
    console.error(`Erreur delete-anime-data (${fileKey}):`, err)
    throw new Error(err.message || JSON.stringify(err))
  }
}

async function LoadAllAnimeDataFromSupabase(fileKey) {
  try {
    const { data: allData, error } = await supabase.from(fileKey).select("*")
    if (error) throw error
    const result = {}
    allData.forEach((row) => {
      result[row.storageKey] = row.data
    })
    return result
  } catch (err) {
    console.error(`Erreur load-all-anime-data (${fileKey}):`, err)
    throw new Error(err.message || JSON.stringify(err))
  }
}

async function ImportDataFromSupabase() {
  try {
    for(const fileKey of ["animeAlreadySeen", "animeFavorites", "animeOnHold", "animeWatchHistory", "animeWatchlist"]) {
      const localData = await LoadAllAnimeDataFromLocal(fileKey)
      const supabaseData = await LoadAllAnimeDataFromSupabase(fileKey)
      for(const storageKey in localData) {
          const rivalKey = fileKey == "animeWatchHistory" && Object.keys(supabaseData).find(k => k !== storageKey && k.split("/").slice(0, -1).join("/") === storageKey.split("/").slice(0, -1).join("/"))
          if(rivalKey && supabaseData[rivalKey].timestamp >= localData[storageKey].timestamp) continue
          if(rivalKey) await DeleteAnimeDataFromSupabase(fileKey, rivalKey)
          if(!(storageKey in supabaseData) || localData[storageKey].timestamp > supabaseData[storageKey].timestamp) {
              SaveAnimeDataToSupabase(fileKey, storageKey, localData[storageKey])
          }
      }
    }
  } catch (err) {
    console.error(`Erreur load-all-anime-data:`, err)
    throw new Error(err.message || JSON.stringify(err))
  }
}

export {
  SaveAnimeDataToSupabase,
  LoadAnimeDataFromSupabase,
  DeleteAnimeDataFromSupabase,
  LoadAllAnimeDataFromSupabase,
  ImportDataFromSupabase,
}
