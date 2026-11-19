import { getUserId } from "@services/supabase/Client"
import { localStore } from "./localStore"
import { supabaseStore, seasonPrefix } from "./supabaseStore"

export const SYNCED_COLLECTIONS = [
  "animeAlreadySeen",
  "animeFavorites",
  "animeOnHold",
  "animeWatchHistory",
  "animeWatchlist",
]
const isSynced = (collection) => SYNCED_COLLECTIONS.includes(collection)

async function target(collection) {
  return isSynced(collection) ? await getUserId() : null
}
const inflight = new Map()
const dedupe = (key, fn) => {
  if (inflight.has(key)) return inflight.get(key)
  const p = fn().finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}
const invalidate = (collection) => {
  for (const k of inflight.keys()) if (k.startsWith(`${collection}|`)) inflight.delete(k)
}

const warned = new Set()
const softFail = (op, collection, error, fallback) => {
  const k = `${op}:${collection}:${error.message}`
  if (!warned.has(k)) { warned.add(k); console.warn(`[animeData.${op}] ${collection} :`, error.message) }
  return fallback
}

export const animeData = {
  async save(collection, key, data) {
    const uid = await target(collection)
    invalidate(collection)
    return uid ? supabaseStore.save(uid, collection, key, data) : localStore.save(collection, key, data)
  },
  async load(collection, key) {
    try {
      const uid = await target(collection)
      return uid ? await supabaseStore.load(uid, collection, key) : await localStore.load(collection, key)
    } catch (e) { return softFail("load", collection, e, null) }
  },
  async loadAll(collection) {
    try {
      const uid = await target(collection)
      return await dedupe(`${collection}|${uid ?? "local"}`, () =>
        uid ? supabaseStore.loadAll(uid, collection) : localStore.loadAll(collection))
    } catch (e) { return softFail("loadAll", collection, e, {}) }
  },
  async delete(collection, key, siblingsOnly = false) {
    const uid = await target(collection)
    invalidate(collection)
    if (uid) {
      return siblingsOnly
        ? supabaseStore.removeSiblings(uid, collection, key)
        : supabaseStore.remove(uid, collection, key)
    }
    return siblingsOnly
      ? localStore.removeSiblings(collection, key)
      : localStore.remove(collection, key)
  },
}

export async function syncLocalToAccount() {
  const uid = await getUserId()
  if (!uid) return
  for (const collection of SYNCED_COLLECTIONS) {
    const [local, remote] = await Promise.all([
      localStore.loadAll(collection),
      supabaseStore.loadAll(uid, collection),
    ])
    const toWrite = []
    const toDelete = []
    for (const [key, value] of Object.entries(local)) {
      let rival
      if (collection === "animeWatchHistory") {
        const prefix = seasonPrefix(key)
        rival = Object.keys(remote).find((k) => k !== key && seasonPrefix(k) === prefix)
        if (rival && (remote[rival].timestamp ?? 0) >= (value.timestamp ?? 0)) continue
      }
      const existing = remote[key]
      if (!existing || (value.timestamp ?? 0) > (existing.timestamp ?? 0)) {
        toWrite.push([key, value])
        if (rival) toDelete.push(rival)
      }
    }
    await supabaseStore.saveMany(uid, collection, toWrite)
    await Promise.all(toDelete.map((k) => supabaseStore.remove(uid, collection, k)))
  }
}
