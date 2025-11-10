import { ipcMain } from "electron"
const BASE_URL = "https://anime-sama.org"
const CATALOGUE_URL = `${BASE_URL}/catalogue`

import axios from "axios"
import * as cheerio from "cheerio"

function getHeaders(referer = BASE_URL) {
  return {
    "User-Agent": "Mozilla/5.0",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    Referer: referer,
  }
}

function LatestScans(scraper) {
  ipcMain.handle("get-latest-scans", async (event) => {
    try {
      return await scraper.getLatestScans(["vostfr", "vf"])
    } catch (error) {
      console.error("Erreur dans le main process:", error)
      return null
    }
  })
}

export { LatestScans }
