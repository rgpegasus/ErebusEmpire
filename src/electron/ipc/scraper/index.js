import { registerCatalogHandlers } from "./catalog"
import { registerSeasonHandlers } from "./seasons"
import { registerScanHandlers } from "./scans"
import { registerSourceHandlers } from "./sources"

export function registerScraperHandlers(scraper) {
  registerCatalogHandlers(scraper)
  registerSeasonHandlers(scraper)
  registerScanHandlers(scraper)
  registerSourceHandlers(scraper)
}
