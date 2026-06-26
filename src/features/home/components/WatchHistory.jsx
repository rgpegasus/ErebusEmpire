import React, { useRef, useEffect, useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { useLoader } from "@utils/dispatchers/Page"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/effect-coverflow"
import ContentsCarousel from "@components/contents-carousel/ContentsCarousel"
import { UserContext } from '@context/user-context/UserContext';

const WatchHistory = () => {
  const { favoriteLanguage } = useContext(UserContext);
  const [watchedEpisodes, setWatchedEpisodes] = useState([])
  const navigate = useNavigate()
  const { setLoading } = useLoader()
  const [contentType, setContentType] = useState("anime")
  const [episodes, setEpisodes] = useState({})
  const [scans, setScans] = useState([])
  const [searchValue, setSearchValue] = useState("")
  const [availableContentTypes, setAvailableContentTypes] = useState({
    hasAnime: false,
    hasManga: false, 
  })
  const [availableLanguages, setAvailableLanguages] = useState([])
  const [selectedLanguage, setSelectedLanguage] = useState("")
  useEffect(() => {
    loadWatchedEpisodes()
  }, [])

  const loadWatchedEpisodes = async () => {
    const all = await animeData.loadAll("animeWatchHistory")
    if (!all) return

    const data = Object.entries(all).map(([key, data]) => ({ key, ...data }))
    data.sort((a, b) => b.timestamp - a.timestamp)

    const tempEpisodes = {}
    const tempScans = []
    const tempLanguages = []

    for (const element of data) {
      if (!element.seasonUrl?.includes("scan")) {
        if (!tempLanguages.includes(element.selectedLanguage)) {
          tempLanguages.push(element.selectedLanguage)
        }

        tempEpisodes[element.selectedLanguage] ??= []
        tempEpisodes[element.selectedLanguage].push(element)
      } else {
        tempScans.push(element)
      }
    }
    tempLanguages.sort((a, b) => {
      if (favoriteLanguage) {
        if (a === favoriteLanguage) return -1
        if (b === favoriteLanguage) return 1
      
        return tempEpisodes[b].length - tempEpisodes[a].length
      }
    })
    setEpisodes(tempEpisodes)
    setScans(tempScans)
    setAvailableLanguages(tempLanguages)

    if (tempLanguages.length > 0 && !(selectedLanguage && tempLanguages.includes(selectedLanguage))) {
      setSelectedLanguage(tempLanguages[0])
    }

    setAvailableContentTypes({
      hasAnime: Object.keys(tempEpisodes).length > 0,
      hasManga: tempScans.length > 0,
    })

    if (Object.keys(tempEpisodes).length === 0) {
      setWatchedEpisodes(tempScans)
    } else if (tempLanguages.length > 0) {
      setWatchedEpisodes(tempEpisodes[!(selectedLanguage && tempLanguages.includes(selectedLanguage)) ? tempLanguages[0] : selectedLanguage])
    }
  }
  const handleContentTypeChange = (newType) => {
    setContentType(newType)    
    if (newType === "anime") {
      setWatchedEpisodes(episodes[selectedLanguage])
    } else {
      setWatchedEpisodes(scans)
    }
  }
  const deleteEpisode = async (episode) => {
    await animeData.delete("animeWatchHistory", episode.key)
    loadWatchedEpisodes()
  }

  const fetchEpisodes = async (episode) => {
    const result = {}
    let languageResults = null

    try {
      const baseUrl = episode.seasonUrl.split("/").slice(0, 6).join("/")

      if (!episode.seasonUrl.includes("scan") && episode.availableLanguages) {
        languageResults = await Promise.all(
          episode?.availableLanguages.map(async (lang) => {
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
        languageResults = [{ lang: "vf", data: episodeLinks }]
      }
      if (languageResults) {
        languageResults.forEach((item) => {
          if(item) {
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
    if (episode.contentType === "anime") {
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
          contentType: episode.contentType,
        },
      })
    } else if (episode.contentType === "manga") {
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
          contentType: episode.contentType,
        },
      })
    }
    setLoading(false)
  }
  const handleLanguageChange = (lang) => {
    if (contentType == "anime") {
      setSelectedLanguage(lang.toLowerCase())
      setWatchedEpisodes(episodes[lang.toLowerCase()] || [])
    }
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
      currentLanguage={contentType == "anime" ? selectedLanguage : "vf"}
      enableShiftDelete={true}
      display={false}
      isGridMode={false}
      onContentTypeChange={handleContentTypeChange}
      availableContentTypes={availableContentTypes}
      availableLanguages={contentType == "anime" ? availableLanguages : ["vf"]}
      onLanguageChange={handleLanguageChange}
      contentType={contentType}
      searchValue={searchValue}
      setSearchValue={setSearchValue}
    />
  )
}

export default WatchHistory
