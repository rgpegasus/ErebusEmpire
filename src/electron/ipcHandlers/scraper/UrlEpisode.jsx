import { ipcMain } from "electron"
import { getVideoUrlFromEmbed } from "better-ani-scraped"
import puppeteer from "puppeteer-core"

const chromePath =
  "C:\\Users\\gabin\\Desktop\\CODE\\ANIME_SAMA\\ELECTRON\\ErebusEmpire\\puppeteer\\chrome\\win64-135.0.7049.95\\chrome-win64\\chrome.exe"

  const launchBrowser = () => {
    return puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
  }
  
async function getVidmolyVideo(url) {
  if (url.includes("vidmoly.to/")) url = url.replace("vidmoly.to/", "vidmoly.net/")

  const browser = await launchBrowser()

  const page = await browser.newPage()
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  )

  await page.goto(url, { waitUntil: "domcontentloaded" })

  const start = Date.now()
  const maxWait = 10000
  const maxReloads = 50
  let reloadCount = 0
  let videoUrl = null

  while (Date.now() - start < maxWait) {
    videoUrl = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script")).map(
        (s) => s.textContent || "",
      )
      for (const s of scripts) {
        const match = s.match(/file\s*:\s*"(https?:\/\/[^"]+\.m3u8[^"]*)"/)
        if (match && match[1]) return match[1]
      }
      return null
    })

    if (videoUrl) break

    const pleaseWait = await page.evaluate(() => {
      const t = (document.title || "").toLowerCase()
      const b = document.body?.innerText?.toLowerCase() || ""
      return t.includes("please wait") || b.includes("please wait")
    })

    if (pleaseWait && reloadCount < maxReloads) {
      reloadCount++
      console.log(`[getVidmolyVideo] detected 'Please Wait' — reload #${reloadCount}`)
      await page.reload({ waitUntil: "domcontentloaded" }).catch(() => null)
    }

    await new Promise((r) => setTimeout(r, 300))
  }

  await browser.close()

  if (!videoUrl) console.warn("[getVidmolyVideo] timeout: video not found")
  return videoUrl
}

 async function getMovearnpreOrSmoothpreVideo(embedUrl) {
  console.log("caca")
  const browser = await launchBrowser()
  const page = await browser.newPage()

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  )

  await page.goto(embedUrl, { waitUntil: "networkidle2" })

  await page.waitForFunction('typeof jwplayer !== "undefined"')

  const videoUrl = await page.evaluate(() => {
    const player = jwplayer()
    const sources = player?.getPlaylist()?.[0]?.sources
    return sources?.[0]?.file || null
  })

  await browser.close()
  const finalUrl = embedUrl.split("/").slice(0, 3).join("/") + videoUrl
  return finalUrl
}
function UrlEpisode() {
  ipcMain.handle("get-url", async (event, query, host) => {
    if (host === "vidmoly") return await getVidmolyVideo(query)
    if (host === "movearnpre") return await getMovearnpreOrSmoothpreVideo(query)
    try {
      return await getVideoUrlFromEmbed(host, query)
    } catch (error) {
      console.error("Erreur dans le main process:", error)
      return null
    }
  })
}

export { UrlEpisode }
