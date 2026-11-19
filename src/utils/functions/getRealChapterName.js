import { toSlug } from "@utils/functions/toSlug"
import { sanitizeName } from "@utils/functions/sanitizeName"

const NUM_RE = /(?:chapitre|tome|volume)\s*(\d+)/i

export async function getRealChapterName(chapterInfo) {
  const { url, chapter } = chapterInfo
  if (!url || !chapter) return null
  const parts = url.split("/")
  const animeId = parts[4]
  const seasonId = parts[5]

  const data = await window.api.invoke("get-scans-chapter", url)
  const chapters = (data?.scans ?? []).map((c, id) => ({ ...c, id }))
  if (chapters.length === 0) return null

  const wantedNumber = sanitizeName(chapter).match(NUM_RE)?.[1] ?? null
  const slug = toSlug(chapter)
  const matched =
    chapters.find((c) => toSlug(c.title) === slug) ??
    (wantedNumber && chapters.find((c) => c.title?.match(NUM_RE)?.[1] === wantedNumber)) ??
    chapters.find((c) => toSlug(c.title).includes(slug) || slug.includes(toSlug(c.title))) ??
    chapters[0]

  return {
    path: `/erebus-empire/${animeId}/${seasonId}/${toSlug(matched.title)}`,
    chapters,
    matchedChapter: matched, 
    encodedTitle: data.encodedTitle,
    animeId,
    seasonId,
    seasonTitle: chapterInfo.seasonTitle,
  }
}
