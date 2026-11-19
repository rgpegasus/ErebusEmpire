import { handle, memo, asArray, MIN, LANGS, HOSTS } from "./utils"

export function registerSeasonHandlers(scraper) {
  handle("get-seasons", (animeUrl, langs = []) =>
    memo(`seasons:${animeUrl}:${langs}`, 10 * MIN, () => scraper.getSeasons(animeUrl, langs, ["Anime", "Scans"])).then(asArray), [])

  handle("get-available-languages", (seasonUrl) =>
    memo(`langs:${seasonUrl}`, 10 * MIN, () => scraper.getAvailableLanguages(seasonUrl, LANGS, false)).then(asArray), [])

  handle("get-episodes", (seasonUrl, allHost = false, includeInfo = false) =>
    memo(`eps:${seasonUrl}:${allHost}:${includeInfo}`, 2 * MIN, () => scraper.getEmbed(seasonUrl, HOSTS, allHost, includeInfo, true)),
    (_u, _a, includeInfo) => (includeInfo ? {} : []))
}
