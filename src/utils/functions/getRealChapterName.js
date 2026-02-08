import { toSlug } from '@utils/functions/toSlug'
import { sanitizeName } from '@utils/functions/sanitizeName'

async function getRealChapterName(chapterInfo) {
  const animeId = chapterInfo.url.split("/").slice(4, 5).join("/")
  let ChapterName = []
  try {
    ChapterName = await window.electron.ipcRenderer.invoke("get-scans-chapter", chapterInfo.url)
  } catch (err) {
    console.error("Erreur récupération embed:", err)
  }
  if (!ChapterName || ChapterName.length === 0) return null
  const seasonId = chapterInfo.url.split("/").slice(5, 6).join("/")
  const chapterFakeName = sanitizeName(chapterInfo.chapter)
  const chapterNumber = chapterFakeName.match(/(?:chapitre|tome|volume)\s*(\d+)/i)[1] || null
  let matchedEmbed = null
  
  matchedEmbed = Object.values(ChapterName).find((e) => toSlug(e) === toSlug(chapterInfo.chapter))
  if (!matchedEmbed && chapterNumber) {
    matchedEmbed = Object.values(ChapterName).find((e) => {
      const tempChapterNumber = e.title.toLowerCase().match(/(?:chapitre|tome|volume)\s*(\d+)/i)?.[1] || null
      if (tempChapterNumber){
        return tempChapterNumber === chapterNumber
      }
    }).title
  }
  if (!matchedEmbed && chapterNumber) {
    matchedEmbed = Object.values(ChapterName).find((e) => {
      const title = e.title.toLowerCase()
      const match = title.match(/chapitre?\s*(\d+)/i)
      return title.includes(typeToSearch) && match && match[2] === chapterNumber
    })
  }
  if (!matchedEmbed) {
    matchedEmbed = ChapterName.find(
      (e) =>
        toSlug(e.title).includes(toSlug(chapterInfo.title)) ||
        toSlug(chapterInfo.title).includes(toSlug(e.title)),
    )
  }
  if (!matchedEmbed) {
    matchedEmbed = ChapterName[0]
  }
  const finalPath = matchedEmbed
    ? `/erebus-empire/${animeId}/${seasonId}/${toSlug(matchedEmbed)}`
    : `/erebus-empire/${animeId}/${seasonId}`
  return {
    path: finalPath,
    ChapterName,
    matchedEmbed,
    animeId,
    seasonId,
    seasonTitle: chapterInfo.seasonTitle,
  }
};
  
export { getRealChapterName }