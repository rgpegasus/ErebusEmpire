import { handle, memo, asArray, MIN, LANGS } from "./utils"

export function registerCatalogHandlers(scraper) {
  handle("get-working-url", () => memo("workingUrl", 30 * MIN, () => scraper.getWorkingUrl()), "")
  handle("search-anime", (query, limit = 10, page = 1) => scraper.searchAnime(query, limit, [], [], page).then(asArray), [])
  handle("random-anime", (maxAttempts = 20) => scraper.getRandomAnime([], ["Anime", "Film"], maxAttempts), null)
  handle("get-all-anime", (page = 0) => memo(`catalog:${page}`, 5 * MIN, () => scraper.getAllAnime([], [], page)).then(asArray), [])
  handle("get-latest-episode", () => memo("latestEp", 5 * MIN, () => scraper.getLatestEpisodes(LANGS)).then(asArray), [])
  handle("get-latest-scans", () => memo("latestScans", 5 * MIN, () => scraper.getLatestScans(LANGS)).then(asArray), [])
  handle("info-anime", (animeUrl) => memo(`info:${animeUrl}`, 10 * MIN, () => scraper.getAnimeInfo(animeUrl)), {})
}
