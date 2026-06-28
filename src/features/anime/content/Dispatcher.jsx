import React, { useState, useEffect, useRef } from "react"
import { useLocation, useParams } from "react-router-dom"
import { useLoader, Episode, Scans } from "@utils/dispatchers/Page"
import { supabase } from "@services/supabase/Client"

export const Dispatcher = () => {
  const location = useLocation()
  const { setLoading } = useLoader()

  const { animeId, seasonId, episodeId } = useParams()

  const [seasonUrl, setSeasonUrl] = useState(location.state?.seasonUrl || "")
  const [animeTitle, setAnimeTitle] = useState(
    location.state?.animeInfo?.title || location.state?.animeTitle || "",
  )
  const [seasonTitle, setSeasonTitle] = useState(location.state?.seasonTitle || "")
  const [episodeTitle, setEpisodeTitle] = useState(location.state?.episodeTitle || "")
  const [animeCover, setAnimeCover] = useState(
    location.state?.animeInfo?.cover || location.state?.animeCover || "",
  )
  const [contentType, setContentType] = useState(location.state?.contentType || "")
  const [contents, setContents] = useState(location.state?.contents || {})
  const [availableLanguages, setAvailableLanguages] = useState(
    location.state?.availableLanguages || [],
  )
  const [selectedLanguage, setSelectedLanguage] = useState(location.state?.selectedLanguage || "")

  const [restored, setRestored] = useState(false)
  const episodesObj = contents?.[selectedLanguage] || {}
  const normalizedCurrent = episodeTitle?.toLowerCase().replace(/\s+/g, "-")
  const [episodeIndex, setEpisodeIndex] = useState(location.state?.chapterId || -1)

  const storageKey = episodeId ? `/erebus-empire/${animeId}/${seasonId}/${episodeId}` : null
  const skipFinalSaveRef = useRef(false)
  const intervalRef = useRef(null)
  const watchDataRef = useRef({})

  useEffect(() => {
    if (!episodesObj?.length) return

    const index = episodesObj.findIndex((ep) => {
      const normalizedEp = ep.title?.toLowerCase().replace(/\s+/g, "-")

      return normalizedEp === normalizedCurrent
    })
    setEpisodeIndex(index)
  }, [episodesObj, normalizedCurrent])
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
          setAnimeTitle(info?.title)
          setAnimeCover(info?.cover)
        }
        let currentSeason
        if (!seasonTitle || !seasonUrl) {
          const result = await window.electron.ipcRenderer.invoke(
            "get-seasons",
            `${BASE_URL}/catalogue/${animeId}/`,
          )
          currentSeason = result?.find((season) => season.url.split("/")[5] === seasonId)
          setSeasonUrl(currentSeason?.url)
          setSeasonTitle(currentSeason?.title)
        }
        if (!selectedLanguage) {
          setSelectedLanguage(currentSeason?.language)
        }
        setContentType(
          currentSeason
            ? currentSeason?.type?.toLowerCase() === "scans"
              ? "manga"
              : "anime"
            : contentType?.toLowerCase() === "scans"
              ? "manga"
              : "anime",
        )
      } catch (error) {
        console.error("Erreur dans le recalcul Episode:", error)
      } finally {
        setLoading(false)
      }
    }
    if (!animeTitle || !animeCover || !contentType) {
      fetchMissingData()
    }
  }, [animeId, seasonId])

  useEffect(() => {
    watchDataRef.current = {}
  }, [storageKey])

  useEffect(() => {
    if (!restored || !storageKey) return

    const capturedStorageKey = storageKey

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    intervalRef.current = setInterval(() => {
      if (Object.keys(watchDataRef.current).length === 0) return
      animeData.save("animeWatchHistory", capturedStorageKey, watchDataRef.current)
    }, 5000)

    clearSeasonHistory(capturedStorageKey)

    return () => {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      const snapshot = structuredClone(watchDataRef.current)
      if (!skipFinalSaveRef.current && Object.keys(snapshot).length > 0) {
        animeData.save("animeWatchHistory", capturedStorageKey, snapshot)
      }
      skipFinalSaveRef.current = false
    }
  }, [storageKey, restored])

  const clearSeasonHistory = async (currentKey) => {
    try {
      await animeData.delete("animeWatchHistory", currentKey, true)
    } catch (err) {
      console.error("Erreur lors du nettoyage de l'historique :", err)
    }
  }
  const getEpisodeTitle = (title) => {
    setEpisodeTitle(title)
  }
  const getEpisodeIndex = (index) => {
    setEpisodeIndex(index)
  }
  const getContents = (episode) => {
    setContents(episode)
  }
  const getAvailableLanguages = (languages) => {
    setAvailableLanguages(languages)
  }
  const getRestored = (bool) => {
    setRestored(bool)
  }
  const getWatchDataRef = (data) => {
    watchDataRef.current = data
  }

  if (contentType == "manga") {
    return (
      <Scans
        animeId={animeId}
        seasonId={seasonId}
        episodeId={episodeId}
        episodeIndex={episodeIndex}
        animeTitle={animeTitle}
        episodeTitle={episodeTitle}
        animeCover={animeCover}
        seasonUrl={seasonUrl}
        seasonTitle={seasonTitle}
        selectedLanguage={selectedLanguage}
        contents={contents}
        availableLanguages={availableLanguages}
        getEpisodeTitle={getEpisodeTitle}
        getWatchDataRef={getWatchDataRef}
        getContents={getContents}
        getAvailableLanguages={getAvailableLanguages}
        getRestored={getRestored}
        getEpisodeIndex={getEpisodeIndex}
      />
    )
  } else if (contentType == "anime") {
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
        contents={contents}
        availableLanguages={availableLanguages}
        restored={restored}
        getEpisodeTitle={getEpisodeTitle}
        getWatchDataRef={getWatchDataRef}
        getContents={getContents}
        getAvailableLanguages={getAvailableLanguages}
        getRestored={getRestored}
        clearSeasonHistory={clearSeasonHistory}
      />
    )
  } else {
  }
}
