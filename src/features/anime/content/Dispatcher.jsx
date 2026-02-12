import React, { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useLoader, Loader, Episode, Scans } from "@utils/dispatchers/Page"

export const Dispatcher = () => {
  const location = useLocation()
  const { setLoading } = useLoader()

  const { animeId, seasonId, episodeId } = useParams()
  const [animeTitle, setAnimeTitle] = useState(location.state?.animeTitle || "")
  const [animeCover, setAnimeCover] = useState(location.state?.animeCover || "")
  const [seasonUrl, setSeasonUrl] = useState(location.state?.seasonUrl || "")
  const [seasonTitle, setSeasonTitle] = useState(location.state?.seasonTitle || "")
  const [seasonData, setSeasonData] = useState({})
  const [selectedLanguage, setSelectedLanguage] = useState(location.state?.selectedLanguage || "")
  const [animeInfo, setAnimeInfo] = useState({})
  const [episodeTitle, setEpisodeTitle] = useState(location.state?.episodeTitle || "")
  const [currentEpisodes, setCurrentEpisodes] = useState(location.state?.episodes || null)
  const [availableLanguages, setAvailableLanguages] = useState(
    location.state?.availableLanguages || null,
  )
  
  const [contentType, setContentType] = useState("anime")
  const [restored, setRestored] = useState(false)
  const episodesObj = currentEpisodes?.[selectedLanguage] || {}
  const episodeIndex = Object.values(episodesObj).findIndex((ep) => {
    const normalizedEp = ep.title?.toLowerCase().replace(/\s+/g, "-")
    const normalizedCurrent = episodeTitle?.toLowerCase().replace(/\s+/g, "-")
    return normalizedEp === normalizedCurrent
  })

  const storageKey = episodeId ? `/erebus-empire/${animeId}/${seasonId}/${episodeId}` : null
  const skipFinalSaveRef = useRef(false)
  const intervalRef = useRef(null)
  const watchDataRef = useRef({})
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
          setAnimeTitle(info.title)
          setAnimeCover(info.cover)
          setAnimeInfo(info || {})
        } else {
          setAnimeInfo({ title: animeTitle, cover: animeCover })
        }
        let currentSeason;
        if (!seasonTitle || !seasonUrl) {
          const result = await window.electron.ipcRenderer.invoke(
            "get-seasons",
            `${BASE_URL}/catalogue/${animeId}/`,
          )
          currentSeason = result?.find(
            (season) => season.url.split("/")[5] === seasonId,
          )
          setSeasonData(currentSeason)
          setSeasonUrl(currentSeason.url)
          setSeasonTitle(currentSeason.title)
        }
        if (!selectedLanguage) {
          setSelectedLanguage(currentSeason.language)
        }
        console.log(currentSeason, seasonData, "oui")
        setContentType(
          currentSeason
            ? currentSeason?.type.toLowerCase() === "scans"
              ? "manga"
              : "anime"
            : seasonData?.type === "scans"
              ? "manga"
              : "anime",
        )
      } catch (error) {
        console.error("Erreur dans le recalcul Episode:", error)
      } finally {
        setLoading(false)
      }
    }
    if (Object.keys(animeInfo).length === 0) {
      fetchMissingData()
    }
  }, [animeId])

  useEffect(() => {
    if (!restored || !storageKey) return

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
  }, [storageKey, restored])
  useEffect(() => {
    skipFinalSaveRef.current = false
  }, [storageKey])

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
  const getEpisodeTitle = (title) => {
    console.log("title", title)
    setEpisodeTitle(title)
  }
  const getCurrentEpisodes = (episode) => {
    // console.log("episode",episode)
    setCurrentEpisodes(episode)
  }
  const getAvailableLanguages = (languages) => {
    // console.log("languages",languages)
    setAvailableLanguages(languages)
  }
  const getRestored = (bool) => {
    // console.log("languages",languages)
    setRestored(bool)
  }
  const getWatchDataRef = (data) => {
    // console.log("data", data)
    watchDataRef.current = data
  }

  if (contentType == "manga") {
    // console.log("scan")
    return (
      <Scans
        animeId={animeId}
        seasonId={seasonId}
        episodeId={episodeId}
        episodeIndex={episodeIndex}
        storageKey={storageKey}
        animeTitle={animeTitle}
        episodeTitle={episodeTitle}
        animeCover={animeCover}
        seasonUrl={seasonUrl}
        seasonTitle={seasonTitle}
        selectedLanguage={selectedLanguage}
        currentEpisodes={currentEpisodes}
        availableLanguages={availableLanguages}
        getEpisodeTitle={getEpisodeTitle}
        getWatchDataRef={getWatchDataRef}
        getCurrentEpisodes={getCurrentEpisodes}
        getAvailableLanguages={getAvailableLanguages}
        getRestored={getRestored}
      />
    )
  } else {
    console.log(contentType, "caca")
    return (
      <Episode
        animeId={animeId}
        seasonId={seasonId}
        episodeId={episodeId}
        episodeIndex={episodeIndex}
        storageKey={storageKey}
        animeTitle={animeTitle}
        episodeTitle={episodeTitle}
        animeCover={animeCover}
        seasonUrl={seasonUrl}
        seasonTitle={seasonTitle}
        selectedLanguage={selectedLanguage}
        currentEpisodes={currentEpisodes}
        availableLanguages={availableLanguages}
        restored={restored}
        getEpisodeTitle={getEpisodeTitle}
        getWatchDataRef={getWatchDataRef}
        getCurrentEpisodes={getCurrentEpisodes}
        getAvailableLanguages={getAvailableLanguages}
        getRestored={getRestored}
      />
    )
  }
}
