import React, { useState, useEffect } from 'react';
import styles from "./Season.module.css"
import useEmblaCarousel from "embla-carousel-react";
import { useParams, useNavigate } from 'react-router-dom';
import { useLoader } from '@utils/dispatchers/Page';
import { toSlug } from '@utils/functions/toSlug'
import BackgroundCover from "@components/background-cover/BackgroundCover"
import ContentsCarousel from '@components/contents-carousel/ContentsCarousel';

export const Season = () => {
  const { animeId, seasonId } = useParams()
  const navigate = useNavigate()
  const { loading, setLoading } = useLoader()

  const [animeUrl, setAnimeUrl] = useState(null)
  const [animeInfo, setAnimeInfo] = useState(null)
  const [coverInfo, setCoverInfo] = useState(null)

  const [seasons, setSeasons] = useState([])
  const [selectedSeason, setSelectedSeason] = useState("")
  const [contentType, setContentType] = useState("anime")
  const [availableContentTypes, setAvailableContentTypes] = useState({
    hasAnime: false,
    hasManga: false,
  })

  const [availableLanguages, setAvailableLanguages] = useState([])
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [animeEncodedTitle, setAnimeEncodedTitle] = useState("")
  const [episodes, setEpisodes] = useState([])
  const [episodeCache, setEpisodeCache] = useState({})

  
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: true, skipSnaps: false })

  useEffect(() => {
    const fetchBaseUrl = async () => {
      try {
        const url = await window.electron.ipcRenderer.invoke("get-working-url")
        setAnimeUrl(`${url}/catalogue/${animeId}/`)
        setSeasons([])
      } catch (err) {
        console.error("Erreur récupération embed:", err)
      }
    }
    
    fetchBaseUrl()
  }, [animeId])

  useEffect(() => {
    if (!animeUrl) return
    const fetchAnimeInfo = async () => {
      try {
        setLoading(true)
        const info = await window.electron.ipcRenderer.invoke("info-anime", animeUrl)
        if (!info?.title) {
          return
        }
        setAnimeInfo(info)
        setCoverInfo({ ...info, url: animeUrl })
      } catch (error) {
        console.error("Erreur lors de la récupération des informations de l'anime :", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnimeInfo()
  }, [animeUrl])

  useEffect(() => {
    if (!animeUrl) return
    const fetchSeasons = async () => {
      try {
        setLoading(true)
        let result = []
        if (seasons.length == 0) {
          result = await window.electron.ipcRenderer.invoke("get-seasons", animeUrl)
          if (result?.length === 0) {
            console.warn("Aucune saison trouvée ou erreur:", result?.error)
            setSeasons([])
            setSelectedSeason(null)
            setLoading(false)
            return
          }
          if (!seasonId) {
            navigate(`/erebus-empire/${animeId}/${result?.[0]?.url.split("/")?.[5]}`, { replace: true })
          }
          const animeSeasons = result.filter((season) => season.type.toLowerCase() ==="anime")
          const scanSeasons = result.filter((season) => season.type.toLowerCase() ==="scans")

          setAvailableContentTypes({
            hasAnime: animeSeasons.length > 0,
            hasManga: scanSeasons.length > 0,
          })

          setSeasons(result)
        }
        const currentSeason =
          result?.find((season) => season.url.split("/")[5] === seasonId) ||
          seasons?.find((season) => season.url.split("/")[5] === seasonId) ||
          seasons?.[0] ||
          result?.[0]
        const baseSeasonUrl = currentSeason?.url.split("/").slice(0, 6).join("/")
        setSelectedSeason(baseSeasonUrl)
        setContentType(currentSeason?.type.toLowerCase() === "scans" ? "manga" : "anime")
        setSelectedLanguage(currentSeason.language)
      } catch (error) {
        console.error("Erreur lors de la récupération des saisons :", error)
        setSeasons([])
        setSelectedSeason(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSeasons()
  }, [animeUrl, seasonId])

  useEffect(() => {
    if (!selectedSeason || !selectedLanguage || contentType != "anime") return
    const fetchEpisodes = async () => {
      setLoading(true)
      try {
        const currentLanguage = selectedLanguage.toLowerCase()
        if (episodeCache[selectedSeason]?.[currentLanguage]) {
          setEpisodes(episodeCache[selectedSeason][currentLanguage])
          return
        }
        const seasonLangUrl = `${selectedSeason}/${currentLanguage}`
        const languages = await window.electron.ipcRenderer.invoke(
          "get-available-languages",
          seasonLangUrl,
        )
        setAvailableLanguages(languages)
        const episodeLinks = await window.electron.ipcRenderer.invoke(
          "get-episodes",
          seasonLangUrl,
          true,
        )
        setEpisodes(episodeLinks)
        setEpisodeCache((prevCache) => ({
          ...prevCache,
          [selectedSeason]: {
            ...(prevCache[selectedSeason] || {}),
            [selectedLanguage]: episodeLinks,
          },
        }))
      } catch (error) {
        console.error("Erreur lors de la récupération des épisodes :", error)
      } finally {
        setLoading(false)
      }
    }
    fetchEpisodes()
  }, [selectedSeason, selectedLanguage, contentType])

  useEffect(() => {
    if (!selectedSeason || !selectedLanguage || contentType != "manga") return
    const fetchScans = async () => {
      try {
        setLoading(true)
        const currentLanguage = selectedLanguage.toLowerCase()
        if (episodeCache[selectedSeason]?.[currentLanguage]) {
          setEpisodes(episodeCache[selectedSeason][currentLanguage])
          return
        }
        const chapterTempLink = await window.electron.ipcRenderer.invoke(
          "get-scans-chapter",
          `${selectedSeason}/${selectedLanguage}`,
        )
        const chapterLink = chapterTempLink?.scans.map((chap, index) => ({
          id: index, 
          numberImg: chap.numberImg,
          title: chap.title,
        }))
        setEpisodes(chapterLink)
        setAnimeEncodedTitle(chapterTempLink.encodedTitle)
        setEpisodeCache((prevCache) => ({
          ...prevCache,
          [selectedSeason]: {
            ...(prevCache[selectedSeason] || {}),
            [selectedLanguage]: chapterLink,
          },
        }))
      } catch (error) {
        console.error("Erreur lors de la récupération des scans :", error)
      } finally {
        setLoading(false)
      }
    }
    fetchScans()
  }, [selectedSeason, contentType, selectedLanguage])

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang.toLowerCase())
  }
  const handleSeasonSelect = (season) => {
    const newSeasonUrl = season.url.split("/").slice(0, 6).join("/")
    setSelectedSeason(newSeasonUrl)
    if (season.type === "scans") {
      setAvailableLanguages([season.language])
      setSelectedLanguage(season.language)
    }
    navigate(`/erebus-empire/${animeId}/${newSeasonUrl.split("/")[5]}`, { replace: true })
  }

  const handleContentTypeChange = (newType) => {
    setContentType(newType)
    setEpisodes([])
    setAvailableLanguages([])
    setSelectedLanguage("")
    const newTypeSeasons = seasons?.filter((season) =>
        newType === "anime"
        ? season.type.toLowerCase() === "anime"
        : season.type.toLowerCase() === "scans"
    )
    if (newTypeSeasons.length > 0) {
      handleSeasonSelect(newTypeSeasons[0])
    }
  }

  const handleEpisodeClick = async (episode) => {
    setLoading(true)
    const episodeId = toSlug(episode.title)
    const selectedSeasonData = seasons?.find((season) =>
      season.url.includes(`/${selectedSeason.split("/")[5]}/`),
    )
    const path = `/erebus-empire/${animeId}/${seasonId}/${episodeId}`

    
    try {
      if (contentType === "anime") {
        const currentCache = episodeCache[selectedSeason] || {}
        const missingLangs = availableLanguages?.filter((lang) => !currentCache[lang.toLowerCase()])

        const missingEpisodes = await Promise.all(
          missingLangs.map(async (lang) => {
            const langUrl = `${selectedSeason}/${lang.toLowerCase()}`
            const eps = await window.electron.ipcRenderer.invoke("get-episodes", langUrl, true)
            return [lang.toLowerCase(), eps]
          }),
        )
        const updatedCache = {
          ...currentCache,
          ...Object.fromEntries(missingEpisodes),
        }
        navigate(path, {
          state: {
            episodeTitle: episode.title,
            contents: updatedCache,
            animeId,
            seasonId,
            seasonTitle: selectedSeasonData?.title,
            seasonUrl: `${selectedSeason}/${selectedLanguage}`,
            availableLanguages,
            selectedLanguage,
            contentType,
            animeInfo,
          },
        })
      } else if (contentType === "manga") {
        const langUrl = `${selectedSeason}/${selectedLanguage.toLowerCase()}`
        const scansImg = await window.electron.ipcRenderer.invoke(
          "get-scans-img",
          langUrl,
          episode.id,
          episode.numberImg,
          animeEncodedTitle,
        )
        navigate(path, {
          state: {
            episodeTitle: episode.title,
            scans: scansImg,
            contents: episodeCache[selectedSeason] || {},
            chapterId: episode.id,
            animeId,
            seasonId,
            seasonTitle: selectedSeasonData?.title,
            seasonUrl: langUrl,
            availableLanguages,
            selectedLanguage,
            contentType,
            animeInfo,
          },
        })
      }
    } catch (error) {
      console.error("Erreur dans handleEpisodeClick :", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSeasons = (() => {
    const seenUrls = new Set()
    return seasons?.filter((season) => {
      const matchesType =
        contentType === "anime"
          ? season.type.toLowerCase() === "anime"
          : season.type.toLowerCase() === "scans"

      if (!matchesType) return false
      if (seenUrls.has(season.url)) return false

      seenUrls.add(season.url)
      return true
    })
  })()

  useEffect(() => {
    if (!emblaApi || seasons?.length === 0) return

    const selectedIndex = seasons?.findIndex((season) => season.url.split("/").slice(0, 6).join("/") === selectedSeason)
    if (selectedIndex >= 0) {
      emblaApi.scrollTo(selectedIndex, true)
    }
  }, [emblaApi, selectedSeason, seasons])
    return (
      <div className="MainPage">
        <BackgroundCover coverInfo={coverInfo} whileWatching={true} isAnime={true} />
        <div className={styles.SeasonContainer}>
          {filteredSeasons?.length > 0 && (
            <div className={styles.EmblaViewport} ref={emblaRef}>
              <div className={styles.EmblaContainer}>
                {filteredSeasons?.map((season) => {
                  const isActive = season.url.split("/").slice(0, 6).join("/") === selectedSeason
                  return (
                    <div
                      key={toSlug(season.title)}
                      onClick={() => handleSeasonSelect(season)}
                      className={`${styles.SeasonItem} ${isActive ? styles.ActiveSeason : ""}`}
                    >
                      {season.title}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.Container}>
          <ContentsCarousel
            data={episodes}
            onClickEpisode={handleEpisodeClick}
            getEpisodeCover={() => animeInfo?.cover}
            getAnimeTitle={() => animeInfo?.title}
            getEpisodeSubTitle={(ep) => {
              const seasonTitle = seasons.find((season) =>
                season.url.includes(`/${selectedSeason.split("/")[5]}/`),
              )?.title
              return `${seasonTitle} - ${ep.title}`
            }}
            getEpisodeTitle={(ep) => ep.title}
            getUrlErebus={(ep) => `/erebus-empire/${ep.animeId}/${ep.seasonId}/${ep.episodeId}`}
            currentLanguage={selectedLanguage}
            isSeason={true}
            availableLanguages={availableLanguages}
            onLanguageChange={handleLanguageChange}
            searchBy={"episode"}
            onContentTypeChange={handleContentTypeChange}
            availableContentTypes={availableContentTypes}
            contentType={contentType}
          />
        </div>
      </div>
    )
};