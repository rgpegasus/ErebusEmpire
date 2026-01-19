import { ipcMain } from "electron"
import { getVideoUrlFromEmbed } from "better-ani-scraped"

const chromePath =
  "C:\\Users\\gabin\\Desktop\\CODE\\EREBUS_EMPIRE\\APP\\ErebusEmpire\\puppeteer\\chrome\\win64-135.0.7049.95\\chrome-win64\\chrome.exe"


function UrlEpisode() {
  ipcMain.handle("get-url", async (event, query, host) => {
    try {    
      if (host === "vidmoly" || host === "movearnpre" || host === "smoothpre") {
        return await getVideoUrlFromEmbed(host, query, chromePath)
      }
      return await getVideoUrlFromEmbed(host, query)
      
    } catch (error) {
      console.error("Erreur dans le main process:", error)
      return null
    }
  })
}

export { UrlEpisode }
