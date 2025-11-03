import { ipcMain } from "electron"
import { getVideoUrlFromEmbed } from "better-ani-scraped"
import puppeteer from "puppeteer-core"

const chromePath =
  "C:\\Users\\gabin\\Desktop\\CODE\\ANIME_SAMA\\ELECTRON\\ErebusEmpire\\puppeteer\\chrome\\win64-135.0.7049.95\\chrome-win64\\chrome.exe"

async function getVidmolyVideo(url) {
  const maxReloads = 30
  const initialDelay = 300
  const reloadDelay = 150

  try {
    if (url.includes("vidmoly.to/")) {
      url = url.replace("vidmoly.to/", "vidmoly.net/")
    }

    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=VizDisplayCompositor",
      ],
    })

    const page = await browser.newPage()

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    )

    // Masquer l'automation
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false })
    })

    // Bloquer les ressources inutiles pour accélérer
    await page.setRequestInterception(true)
    page.on("request", (req) => {
      const resourceType = req.resourceType()
      if (resourceType === "image" || resourceType === "stylesheet" || resourceType === "font") {
        req.abort()
      } else {
        req.continue()
      }
    })

    console.log(`[getVidmolyVideo] Navigation vers: ${url}`)
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    })

    // Utiliser setTimeout au lieu de waitForTimeout
    await new Promise((resolve) => setTimeout(resolve, initialDelay))
    console.log(1)
    const isPleaseWaitPage = async () => {
      return await page.evaluate(() => {
        const title = (document.title || "").toLowerCase()
        const bodyText =
          document.body && document.body.innerText ? document.body.innerText.toLowerCase() : ""

        if (
          title.includes("please wait") ||
          bodyText.includes("please wait") ||
          bodyText.includes("waiting") ||
          bodyText.includes("verifying") ||
          title.includes("ddos") ||
          bodyText.includes("ddos protection")
        ) {
          return true
        }

        // Vérifier directement dans les scripts
        const scripts = Array.from(document.querySelectorAll("script"))
        for (const script of scripts) {
          const content = script.textContent || ""
          if (content.includes("file:") && content.includes(".m3u8")) {
            return false
          }
        }

        return true
      })
    }
    console.log(2)
    let reloadCount = 0
    let videoUrl = null

    // Premier essai sans reload
    videoUrl = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script"))
      for (const script of scripts) {
        const content = script.textContent || ""
        const match = content.match(/file\s*:\s*"(https?:\/\/[^"]+\.m3u8[^"]*)"/)
        if (match && match[1]) return match[1]

        // Essayer d'autres patterns
        const patterns = [
          /source\s*:\s*"([^"]+\.m3u8[^"]*)"/,
          /videoUrl\s*:\s*"([^"]+\.m3u8[^"]*)"/,
          /url\s*:\s*"([^"]+\.m3u8[^"]*)"/,
        ]

        for (const pattern of patterns) {
          const altMatch = content.match(pattern)
          if (altMatch && altMatch[1]) {
            let url = altMatch[1]
            if (url.startsWith("//")) url = "https:" + url
            return url
          }
        }
      }
      return null
    })
    console.log(3)
    if (videoUrl) {
      console.log("[getVidmolyVideo] URL trouvée sans reload!")
      await browser.close()
      return videoUrl
    }

    // Si pas trouvé, commencer les reloads optimisés
    while (reloadCount < maxReloads && !videoUrl) {
      const pleaseWait = await isPleaseWaitPage()

      if (!pleaseWait) {
        videoUrl = await page.evaluate(() => {
          const scripts = Array.from(document.querySelectorAll("script"))
          for (const script of scripts) {
            const content = script.textContent || ""
            const match = content.match(/file\s*:\s*"(https?:\/\/[^"]+\.m3u8[^"]*)"/)
            if (match && match[1]) return match[1]
          }
          return null
        })

        if (videoUrl) break
      }

      reloadCount++
      console.log(`[getVidmolyVideo] Reload #${reloadCount}`)

      // Alterner les méthodes de reload
      if (reloadCount % 2 === 0) {
        await page.reload({ waitUntil: "domcontentloaded" })
      } else {
        await page.goto(url, { waitUntil: "domcontentloaded" })
      }

      await new Promise((resolve) => setTimeout(resolve, reloadDelay))

      // Vérifier immédiatement après reload
      videoUrl = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll("script"))
        for (const script of scripts) {
          const content = script.textContent || ""
          const match = content.match(/file\s*:\s*"(https?:\/\/[^"]+\.m3u8[^"]*)"/)
          if (match && match[1]) return match[1]
        }
        return null
      })

      if (videoUrl) break
    }

    // Dernière tentative si toujours pas trouvé
    if (!videoUrl) {
      console.log("[getVidmolyVideo] Dernière tentative avec Ctrl+R...")

      try {
        await page.keyboard.down("Control")
        await page.keyboard.press("KeyR")
        await page.keyboard.up("Control")
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Dernière extraction
        videoUrl = await page.evaluate(() => {
          const patterns = [
            /file\s*:\s*"([^"]+\.m3u8[^"]*)"/,
            /source\s*:\s*"([^"]+\.m3u8[^"]*)"/,
            /videoUrl\s*:\s*"([^"]+\.m3u8[^"]*)"/,
            /url\s*:\s*"([^"]+\.m3u8[^"]*)"/,
          ]

          const scripts = Array.from(document.querySelectorAll("script"))
          for (const script of scripts) {
            const content = script.textContent || ""
            for (const pattern of patterns) {
              const match = content.match(pattern)
              if (match && match[1]) {
                let url = match[1]
                if (url.startsWith("//")) url = "https:" + url
                return url
              }
            }
          }
          return null
        })
      } catch (e) {
        console.log("[getVidmolyVideo] Erreur Ctrl+R:", e.message)
      }
    }

    await browser.close()

    if (videoUrl) {
      console.log("[getVidmolyVideo] Succès après", reloadCount, "reloads")
    } else {
      console.log("[getVidmolyVideo] Échec après", reloadCount, "reloads")
    }

    return videoUrl
  } catch (err) {
    console.error("Erreur getVidmolyVideo:", err && err.message ? err.message : err)
    return null
  }
}

function UrlEpisode() {
  ipcMain.handle("get-url", async (event, query, host) => {
    if (host === "vidmoly") {
      return await getVidmolyVideo(query)
    } else {
      try {
        return await getVideoUrlFromEmbed(host, query)
      } catch (error) {
        console.error("Erreur dans le main process:", error)
        return null
      }
    }
  })
}

export { UrlEpisode }
