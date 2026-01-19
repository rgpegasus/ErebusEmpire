import React, { useRef, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLoader } from "@utils/dispatchers/Page"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/effect-coverflow"
import ContentsCarousel from "@components/contents-carousel/ContentsCarousel"

const WatchHistory = () => {
  const [watchedEpisodes, setWatchedEpisodes] = useState([])
  const navigate = useNavigate()
  const { setLoading } = useLoader()
  const [contentType, setContentType] = useState("anime")
  const [episodes, setEpisodes] = useState([])
  const [scans, setScans] = useState([])
  const [availableContentTypes, setAvailableContentTypes] = useState({
    hasAnime: false,
    hasManga: false, 
  })
  useEffect(() => {
    loadWatchedEpisodes()
  }, [])

  const loadWatchedEpisodes = async () => {
    const all = await animeData.loadAll("animeWatchHistory")
    if (!all) return

    const data = Object.entries(all).map(([key, data]) => ({ key, ...data }))
    data.sort((a, b) => b.timestamp - a.timestamp)
    let tempEpisodes = []
    let tempScans = []
    
    for (const element of data) {
      if (!element.seasonUrl.includes("scan")) {
        tempEpisodes.push(element)
        setWatchedEpisodes(episodes)
      } else {
        tempScans.push(element)
      }
      setEpisodes(tempEpisodes)
      setScans(tempScans)
      setAvailableContentTypes({
        hasAnime: tempEpisodes.length > 0,
        hasManga: tempScans.length > 0,
      })
      if (tempEpisodes.length === 0) {
        setWatchedEpisodes(tempScans)
      } else {
        setWatchedEpisodes(tempEpisodes)
      }
    }
  }
  const handleContentTypeChange = (newType) => {
    setContentType(newType)    
    if (newType === "anime") {
      setWatchedEpisodes(episodes)
    } else {
      setWatchedEpisodes(scans)
    }
  }
  const deleteEpisode = async (episode) => {
    await animeData.delete("animeWatchHistory", episode.key)
    const all = await animeData.loadAll("animeWatchHistory")
    if (Object.keys(all).length === 0) {
      setWatchedEpisodes([])
    } else {
      const data = Object.entries(all).map(([key, data]) => ({ key, ...data })) 
      data.sort((a, b) => b.timestamp - a.timestamp)
      let tempEpisodes = []
      let tempScans = []

      for (const element of data) {
        if (!element.seasonUrl.includes("scan")) {
          tempEpisodes.push(element)
          setWatchedEpisodes(episodes)
        } else {
          tempScans.push(element)
        }
        setEpisodes(tempEpisodes)
        setScans(tempScans)
        setAvailableContentTypes({
          hasAnime: tempEpisodes.length > 0,
          hasManga: tempScans.length > 0,
        })
        if (tempEpisodes.length === 0 || episode.seasonUrl.includes("scan")) {
          setWatchedEpisodes(tempScans)
        } else {
          setWatchedEpisodes(tempEpisodes)
        }
      }
    }
  }

  const fetchEpisodes = async (episode) => {
    const result = {}
    let languageResults = null

    try {
      const baseUrl = episode.seasonUrl.split("/").slice(0, 6).join("/")

      if (!episode.seasonUrl.includes("scan")) {
        languageResults = await Promise.all(
          episode.availableLanguages.map(async (lang) => {
            const langUrl = `${baseUrl}/${lang.toLowerCase()}`
            const data = await window.electron.ipcRenderer.invoke("get-episodes", langUrl, true)
            if (data === null) {
              return null
            }
            return { lang, data }
          }),
        )
      } else {
        const episodeLinks = await window.electron.ipcRenderer.invoke(
          "get-scans-chapter",
          episode.seasonUrl,
        )
        result[episode.selectedLanguage] = episodeLinks
      }

      if (languageResults) {
        languageResults.forEach((item) => {
          if (item) {
            const { lang, data } = item
            result[lang.toLowerCase()] = data
          }
        })
      }

      return result
    } catch (error) {
      console.error("Erreur lors de la récupération des épisodes :", error)
      return null
    }
  }

  const handleEpisodeClick = async (episode) => {
    setLoading(true)
    const episodes = await fetchEpisodes(episode)
    if (episodes === null) {
      setLoading(false)
      return
    }
    const episodeId = episode.episodeTitle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    if (!episode.seasonUrl.includes("scan")) {
      navigate(`/erebus-empire/${episode.animeId}/${episode.seasonId}/${episodeId}`, {
        state: {
          episodeTitle: episode.episodeTitle,
          episodes,
          animeId: episode.animeId,
          seasonId: episode.seasonId,
          animeTitle: episode.animeTitle,
          seasonTitle: episode.seasonTitle,
          animeCover: episode.animeCover,
          seasonUrl: episode.seasonUrl,
          availableLanguages: episode.availableLanguages,
          selectedLanguage: episode.selectedLanguage,
        },
      })
    } else {
      const scansImg = await window.electron.ipcRenderer.invoke(
        "get-scans-img",
        episode.seasonUrl,
        episode.episodeTitle,
      )
      navigate(`/erebus-empire/${episode.animeId}/${episode.seasonId}/${episodeId}`, {
        state: {
          episodeTitle: episode.episodeTitle,
          scans: scansImg,
          episodes,
          animeId: episode.animeId,
          seasonId: episode.seasonId,
          animeTitle: episode.animeTitle,
          seasonTitle: episode.seasonTitle,
          animeCover: episode.animeCover,
          seasonUrl: episode.seasonUrl,
          availableLanguages: episode.availableLanguages,
          selectedLanguage: episode.selectedLanguage,
        },
      })
    }
    setLoading(false)
  }
  return (
    <ContentsCarousel
      title="Liste de lecture"
      data={watchedEpisodes}
      onClickEpisode={handleEpisodeClick}
      onDeleteEpisode={(ep) => deleteEpisode(ep)}
      getEpisodeCover={(ep) => ep.animeCover}
      getAnimeTitle={(ep) => ep.animeTitle}
      getAnimeUrl={(ep) => `${ep.seasonUrl}/`}
      getEpisodeSubTitle={(ep) => `${ep.seasonTitle} - ${ep.episodeTitle}`}
      getUrlErebus={(ep) => `/erebus-empire/${ep.animeId}/${ep.seasonId}/${ep.episodeId}`}
      currentLanguage={(ep) => ep.selectedLanguage}
      enableShiftDelete={true}
      display={false}
      isGridMode={false}
      onContentTypeChange={handleContentTypeChange}
      availableContentTypes={availableContentTypes}
      contentType={contentType}
    />
  )
}

export default WatchHistory
