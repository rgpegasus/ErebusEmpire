import { getVideoUrlFromEmbed } from "better-ani-scraped"
import { handle, isHttp, HOSTS } from "./utils"

async function resolveOne(embedUrl, host, timeoutMs = 8000) {
  const run = getVideoUrlFromEmbed(host, embedUrl)
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs))
  try {
    const r = await Promise.race([run, timeout])
    if (!r) return null
    if (typeof r === "object") return r.videoUrl ? { url: r.videoUrl, host, openingTime: r.openingTime } : null
    return { url: r, host }
  } catch (e) {
    console.warn(`[resolve] ${host} : ${e.message}`)
    return null
  }
}

export function registerSourceHandlers(scraper) {
  handle("get-url", (embedUrl, host) => (isHttp(embedUrl) ? resolveOne(embedUrl, host) : null), null)

  handle("resolve-sources", async ({ url = [], host = [] } = {}) => {
    const urls = [].concat(url)
    const hosts = [].concat(host)
    const real = await Promise.all(
      urls.map((u, i) =>
        /\/api\/lien\.php/.test(u) ? scraper.resolveLienUrl(u).catch((e) => (console.warn("[lien]", e.message), null)) : isHttp(u) ? u : null,
      ),
    )
    const items = real
      .map((u, i) => {
        if (!u) return null
        const fixed = u.replace("vidmoly.to/", "vidmoly.biz/")
        const h = hosts[i] || HOSTS.find((name) => fixed.toLowerCase().includes(name))
        return h ? { url: fixed, host: h } : null
      })
      .filter(Boolean)
    const ordered = HOSTS.map((h) => items.find((it) => it.host === h)).filter(Boolean)
    const results = await Promise.all(ordered.map((it) => resolveOne(it.url, it.host)))
    return results.filter(Boolean)
  }, [])
}
