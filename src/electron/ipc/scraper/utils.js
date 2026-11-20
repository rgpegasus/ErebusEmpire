import { ipcMain, BrowserWindow } from "electron"

export const MIN = 60_000
export const LANGS = ["vostfr", "vf", "va"]
export const HOSTS = ["ansembed", "sendvid", "smoothpre", "uqload", "susanexpectcare"]

export const asArray = (v) => (Array.isArray(v) ? v : []) 
export const isHttp = (u) => typeof u === "string" && /^https?:\/\//i.test(u)

const cache = new Map()
const inflight = new Map()
export function memo(key, ttlMs, fn) {
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value)
  if (inflight.has(key)) return inflight.get(key)
  const p = fn()
    .then((value) => {
      cache.set(key, { value, expires: Date.now() + ttlMs })
      return value
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}

export function handle(channel, fn, fallback) {
  ipcMain.handle(channel, async (_e, ...args) => {
    try {
      return await fn(...args)
    } catch (err) {
      console.error(`[ipc:${channel}]`, err)
      return typeof fallback === "function" ? fallback(...args) : fallback
    }
  })
}

