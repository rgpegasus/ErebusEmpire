import { supabase } from "@services/supabase/Client"

const TABLE = "user_data"

const fail = (op, error) => {
  console.error(`[supabaseStore] ${op}:`, error)
  throw new Error(error.message || String(error))
}

const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`)

export const seasonPrefix = (key) => key.split("/").slice(0, -1).join("/") + "/"

export const supabaseStore = {
  async save(userId, collection, key, data) {
    const { error } = await supabase.from(TABLE).upsert(
      { user_id: userId, collection, storage_key: key, data, updated_at: new Date().toISOString() },
      { onConflict: "user_id,collection,storage_key" },
    )
    if (error) fail("save", error)
  },

  async load(userId, collection, key) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("data")
      .eq("user_id", userId)
      .eq("collection", collection)
      .eq("storage_key", key)
      .maybeSingle()
    if (error) fail("load", error)
    return data?.data ?? null
  },

  async loadAll(userId, collection) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("storage_key, data")
      .eq("user_id", userId)
      .eq("collection", collection)
      .order("updated_at", { ascending: false })
    if (error) fail("loadAll", error)
    return Object.fromEntries(data.map((r) => [r.storage_key, r.data]))
  },

  async remove(userId, collection, key) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("collection", collection)
      .eq("storage_key", key)
    if (error) fail("remove", error)
  },

  async removeSiblings(userId, collection, key) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("collection", collection)
      .like("storage_key", `${escapeLike(seasonPrefix(key))}%`)
      .neq("storage_key", key)
    if (error) fail("removeSiblings", error)
  },

  async saveMany(userId, collection, entries) {
    if (entries.length === 0) return
    const rows = entries.map(([storage_key, data]) => ({
      user_id: userId,
      collection,
      storage_key,
      data,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase
      .from(TABLE)
      .upsert(rows, { onConflict: "user_id,collection,storage_key" })
    if (error) fail("saveMany", error)
  },
}
