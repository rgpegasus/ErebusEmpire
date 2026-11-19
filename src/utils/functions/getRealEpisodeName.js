import { toSlug } from "@utils/functions/toSlug"
import { sanitizeName } from "@utils/functions/sanitizeName"

const EP_RE = /e(?:pisode)?\s*(\d+)/i

export async function getRealEpisodeName(episodeInfo) {
  let { url: animeUrl, episode } = episodeInfo
  if (!animeUrl || !episode) return null

  if (animeUrl.startsWith("/catalogue")) {
    const base = await window.api.invoke("get-working-url")
    animeUrl = base + animeUrl
  }
  const parts = animeUrl.split("/")
  const animeId = parts[4]
  const seasonId = parts[5]

  const res = await window.api.invoke("get-episodes", animeUrl, true, true)
  const embedData = res?.episodes ?? []
  if (embedData.length === 0) return null

  const fake = sanitizeName(episode)
  const number = fake.match(/episode(\d+)/i)?.[1] ?? null
  const type = /oa?v/i.test(fake) ? "oav" : /film/i.test(fake) ? "film" : /sp[ée]cial/i.test(fake) ? "special" : "episode"
  const slug = toSlug(episode)

  const matchedEmbed =
    embedData.find((e) => toSlug(e.title) === slug) ??
    (number && embedData.find((e) => e.title.toLowerCase().includes(type) && e.title.match(EP_RE)?.[1] === number)) ??
    embedData.find((e) => toSlug(e.title).includes(slug) || slug.includes(toSlug(e.title))) ??
    embedData[0]

  return {
    path: `/erebus-empire/${animeId}/${seasonId}/${toSlug(matchedEmbed.title)}`,
    embedData,
    matchedEmbed,
    animeId,
    seasonId,
    seasonTitle: res.animeInfo?.seasonTitle ?? null,
  }
}
