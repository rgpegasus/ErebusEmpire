import React, { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useLoader, Loader } from "@utils/dispatchers/Page"

export const Scans = ({ animeId, seasonId, episodeId }) => {
  const location = useLocation()
  let { animeTitle = "", animeCover = "" } = location.state || {}
  const { loading, setLoading } = useLoader()
  const [animeInfo, setAnimeInfo] = useState({})

  const intervalRef = useRef(null)
  const watchDataRef = useRef({})

  const skipFinalSaveRef = useRef(false)
  const [currentSeasonUrl, setCurrentSeasonUrl] = useState(location.state?.seasonUrl || "")
  const storageKey = episodeId ? `/erebus-empire/${animeId}/${seasonId}/${episodeId}` : null
  const [currentEpisodeTitle, setCurrentEpisodeTitle] = useState(location.state?.episodeTitle || "")
  const [currentSeasonTitle, setCurrentSeasonTitle] = useState(location.state?.seasonTitle || "")
  const zoomRef = useRef(null)
  const containerRef = useRef(null)
  const [imgScans, setImgScans] = useState(location.state?.scans || [])
  const [chapterId, setChapterId] = useState(location.state?.chapterId || null)
  const [currentAvailableLanguages, setCurrentAvailableLanguages] = useState(
    location.state?.availableLanguages || null,
  )
  const [currentSelectedLanguage, setCurrentSelectedLanguage] = useState(
    location.state?.selectedLanguage || "",
  )
  const [currentEpisodes, setCurrentEpisodes] = useState(location.state?.episodes || null)
  const [widthPercent, setWidthPercent] = useState(100)
  const episodesObj = currentEpisodes?.[currentSelectedLanguage] || {}
  const episodeIndex = Object.values(episodesObj).findIndex((ep) => {
    const normalizedEp = ep.title?.toLowerCase().replace(/\s+/g, "-")
    const normalizedCurrent = currentEpisodeTitle?.toLowerCase().replace(/\s+/g, "-")
    return normalizedEp === normalizedCurrent
  })
  const prevChapter = currentEpisodes?.[currentSelectedLanguage]?.[episodeIndex - 1]
  const nextChapter = currentEpisodes?.[currentSelectedLanguage]?.[episodeIndex + 1]
  const displayAnimeTitle = animeInfo?.title || animeTitle || ""
  const displayAnimeCover = animeInfo?.cover || animeCover || ""
  const buildWatchData = () => ({
    animeId,
    seasonId,
    episodeId,
    chapterId: chapterId,
    episodeTitle: currentEpisodeTitle,
    animeTitle: displayAnimeTitle,
    seasonTitle: currentSeasonTitle,
    animeCover: displayAnimeCover,
    timestamp: Date.now(),
    seasonUrl: currentSeasonUrl,
    availableLanguages: currentAvailableLanguages,
    selectedLanguage: currentSelectedLanguage,
  })
  useEffect(() => {
    const fetchMissingData = async () => {
      try {
        setLoading(true)
        const BASE_URL = await window.electron.ipcRenderer.invoke("get-working-url")
        if (!animeTitle || !animeCover) {
          const info = await window.electron.ipcRenderer.invoke(
            "info-anime",
            `${BASE_URL}/catalogue/${animeId}/`,
          )
          if (info) {
            setAnimeInfo(info)
          }
        }

        let chosenLang = currentSelectedLanguage ?? null
        let seasonUrl = currentSeasonUrl ?? null
        let seasonTitle = currentSeasonTitle ?? null
        if (!seasonTitle || !seasonUrl) {
          const result = await window.electron.ipcRenderer.invoke(
            "get-seasons",
            `${BASE_URL}/catalogue/${animeId}/`,
          )

          const currentSeason = result.seasons.find(
            (season) => season.url.split("/")[5] === seasonId,
          )
          seasonTitle = currentSeason.title
          seasonUrl = currentSeason.url

          if (!chosenLang) {
            chosenLang = seasonUrl.split("/").slice(6, 7).join("/")
          }
          setCurrentSeasonUrl(seasonUrl)
          setCurrentSeasonTitle(seasonTitle)
        }
        if (!currentAvailableLanguages || !chosenLang) {
          const langs = await window.electron.ipcRenderer.invoke(
            "get-available-languages",
            `${BASE_URL}/catalogue/${animeId}/${seasonId}/${currentSelectedLanguage}`,
          )
          const normalizedLangs = (langs || []).map((lang) => String(lang).toLowerCase())
          setCurrentAvailableLanguages(normalizedLangs)

          if (!chosenLang && normalizedLangs.length > 0) {
            chosenLang = normalizedLangs[0]
            seasonUrl = `${seasonUrl}/${chosenLang}`
            setCurrentSeasonUrl(seasonUrl)
            setCurrentSelectedLanguage(chosenLang)
          }
        }

        if (!currentAvailableLanguages || !chosenLang) {
          const lang = seasonUrl.split("/").slice(6, 7).join("/")
          if (!chosenLang) {
            seasonUrl = `${seasonUrl}/${lang}`
            setCurrentSeasonUrl(seasonUrl)
          }
          chosenLang = lang
          setCurrentAvailableLanguages([chosenLang])
          setCurrentSelectedLanguage(chosenLang)
        }
        const scansLinks = await window.electron.ipcRenderer.invoke("get-scans-chapter", seasonUrl)
        const slugFromUrl = location.pathname.split("/")[4]
        const currentEpisode = Object.entries(scansLinks)
          .map(([id, ep]) => ({ id, ...ep }))
          .find((ep) => {
            return ep?.title?.toLowerCase().replace(/\s+/g, "-") === slugFromUrl
          })

        setCurrentEpisodes(currentEpisode)
        setCurrentEpisodeTitle(currentEpisode?.title)
        setChapterId(currentEpisode?.id)
        const scansImg = await window.electron.ipcRenderer.invoke(
          "get-scans-img",
          seasonUrl,
          currentEpisode?.id,
        )
        setImgScans(scansImg)
        return
      } catch (error) {
        console.error("Erreur dans le recalcul Episode:", error)
      } finally {
        setLoading(false)
      }
    }

    if (
      !currentEpisodes ||
      imgScans.length <= 0 ||
      !currentAvailableLanguages ||
      !currentEpisodeTitle
    ) {
      fetchMissingData()
    }
  }, [
    animeId,
    seasonId,
    episodeId,
    currentEpisodes,
    currentAvailableLanguages,
    currentSelectedLanguage,
  ])

  const clearSeasonHistory = async () => {
    try {
      const allData = await animeData.loadAll("animeWatchHistory")
      const allKeys = Object.keys(allData || {})
      const seasonKeys = allKeys.filter((key) =>
        key.startsWith(`/erebus-empire/${animeId}/${seasonId}/`),
      )
      const keysToDelete = seasonKeys.filter((key) => key !== storageKey)
      await Promise.all(keysToDelete.map((key) => animeData.delete("animeWatchHistory", key)))
    } catch (err) {
      console.error("Erreur lors du nettoyage de l'historique :", err)
    }
  }

  useEffect(() => {
    if (!storageKey) return

    const cleanupOldHistory = async () => {
      try {
        await clearSeasonHistory()
      } catch (err) {
        console.error("Erreur lors du nettoyage de l'historique :", err)
      }
    }
    cleanupOldHistory()

    intervalRef.current = setInterval(() => {
      animeData.save("animeWatchHistory", storageKey, watchDataRef.current)
    }, 5000)

    return () => {
      clearInterval(intervalRef.current)
      if (!skipFinalSaveRef.current) {
        animeData.save("animeWatchHistory", storageKey, watchDataRef.current)
      }
    }
  }, [storageKey])
  useEffect(() => {
    skipFinalSaveRef.current = false
  }, [storageKey])
  useEffect(() => {
    watchDataRef.current = buildWatchData()
  }, [
    animeId,
    seasonId,
    episodeId,
    chapterId,
    currentEpisodeTitle,
    currentSeasonTitle,
    displayAnimeTitle,
    displayAnimeCover,
    currentSeasonUrl,
    currentAvailableLanguages,
    currentSelectedLanguage,
  ])

  useEffect(() => {
    const container = containerRef.current
    const zoom = zoomRef.current
    if (!container) return

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault()
        e.stopPropagation()

        let newWidth = widthPercent
        if (e.deltaY < 0) newWidth += 2
        else newWidth -= 2

        newWidth = Math.min(Math.max(newWidth, 10), 100)
        setWidthPercent(newWidth)

        container.style.width = `${newWidth}%`
      }
    }

    zoom.addEventListener("wheel", handleWheel, { passive: false })

    return () => container.removeEventListener("wheel", handleWheel)
  }, [widthPercent])
  const handleChapterNavigation = (chapter) => {
    if (!chapter) return
    const navId = `${chapter.title.toLowerCase().replace(/\s+/g, "-")}`

    setCurrentEpisodeTitle(chapter.title)
    setResolvedSources([])
    setEpisodeUrl(undefined)
    setEpisodeSources(chapter)

    navigate(`/erebus-empire/${animeId}/${seasonId}/${navId}`, {
      state: {
        ...location.state,
        episodeTitle: chapter.title,
      },
    })
  }
  if (loading) {
    return <Loader />
  }
  return (
    <div className="MainPage">
      <div className="ScansPage" ref={zoomRef}>
        <div className="ScansContainer" ref={containerRef}>
          {imgScans?.map((img, idx) => (
            <img key={idx} className="ImgScans" src={img} alt={`scan-${idx}`} />
          ))}
        </div>
      </div>
      <div onClick={() => prevChapter && handleChapterNavigation(prevChapter)}>Précédent</div>
      <div onClick={() => nextChapter && handleChapterNavigation(nextChapter)}>Suivant</div>
    </div>
  )
}
