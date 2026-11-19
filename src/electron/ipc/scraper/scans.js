import { handle, memo, asArray, MIN } from "./utils"

export function registerScanHandlers(scraper) {
  handle("get-scans-chapter", (scanUrl, withImg = true, withTitle = true) =>
    memo(`chapters:${scanUrl}`, 10 * MIN, () => scraper.getChapterTitles(scanUrl, withImg, withTitle)),
    (_u, _i, withTitle = true) => (withTitle ? { scans: [], encodedTitle: "" } : []))

  handle("get-scans-img", (scanUrl, chapterIndex, numberImg = null, encodedTitle = null) =>
    scraper.getImgScans(scanUrl, chapterIndex, numberImg, encodedTitle).then(asArray), [])
}
