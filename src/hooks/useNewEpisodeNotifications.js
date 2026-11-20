import { useEffect } from "react"
import { animeData } from "@services/data/animeRepository"

const EVERY_MS = 10 * 60_000

export function useNewEpisodeNotifications(enabled) {
  useEffect(() => {
    if (!enabled) return
    let stopped = false

    const check = async () => {
      try {
        const [latest, onHold, notified] = await Promise.all([
          window.api.invoke("get-latest-episode"),
          animeData.loadAll("animeOnHold"),
          animeData.loadAll("notifiedEpisodes"),
        ])
        if (stopped || !latest?.length) return
        const watched = new Map(Object.values(onHold ?? {}).map((a) => [a.animeTitle?.toLowerCase(), a]))
         const known = Array.isArray(notified) ? notified : Object.values(notified ?? {})
        const seen = new Set(known.map((n) => `${n.title}|${n.episode}|${n.language}`))

        for (const ep of latest) {
          const match = watched.get(ep.title.toLowerCase())
          const id = `${ep.title}|${ep.episode}|${ep.language}`
          if (!match || seen.has(id)) continue
          await animeData.save("notifiedEpisodes", id, {
            title: ep.title, url: ep.url, cover: ep.cover || match.animeCover,
            language: ep.language, episode: ep.episode, addedAt: new Date().toISOString(),
          })
          seen.add(id)
        }
      } catch (e) {
        console.warn("[notifications]", e.message)
      }
    }

    check()
    const t = setInterval(check, EVERY_MS)
    return () => { stopped = true; clearInterval(t) }
  }, [enabled])
}
