import React, { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useLoader, Loader } from "@utils/dispatchers/Page"
import { ErebusPlayer } from "@components/video-player/VideoPlayer"

export const Episode = ({ animeId, seasonId, episodeId }) => {
  const navigate = useNavigate()
  const location = useLocation()
  let { animeTitle = "", animeCover = "" } = location.state || {}
  const [videoDuration, setVideoDuration] = useState(0)
  const [restored, setRestored] = useState(false)
  const [animeInfo, setAnimeInfo] = useState({})
  const [episodeUrl, setEpisodeUrl] = useState(undefined)
  const [currentEpisodeTitle, setCurrentEpisodeTitle] = useState(location.state?.episodeTitle || "")
  const [resolvedSources, setResolvedSources] = useState([])
  const { loading, setLoading } = useLoader()
  const [openingTime, setOpeningTime] = useState([0, 0])
  const [episodeSources, setEpisodeSources] = useState(null)
  const [videoTime, setVideoTime] = useState(0)
  const videoTimeRef = useRef(videoTime)
  const displayAnimeTitle = animeInfo?.title || animeTitle || ""
  const displayAnimeCover = animeInfo?.cover || animeCover || ""
  const videoDurationRef = useRef(0)
  const [currentAvailableLanguages, setCurrentAvailableLanguages] = useState(
    location.state?.availableLanguages || null,
  )
  const [currentSeasonUrl, setCurrentSeasonUrl] = useState(location.state?.seasonUrl || "")
  const lastPresenceUpdateRef = useRef(0)
  useEffect(() => {
    videoDurationRef.current = videoDuration
  }, [videoDuration])
  const [currentEpisodes, setCurrentEpisodes] = useState(location.state?.episodes || null)
  const [currentSeasonTitle, setCurrentSeasonTitle] = useState(location.state?.seasonTitle || "")
  const [currentSelectedLanguage, setCurrentSelectedLanguage] = useState(
    location.state?.selectedLanguage || "",
  )
  const episodesObj = currentEpisodes?.[currentSelectedLanguage] || {}
  const episodeIndex = Object.values(episodesObj).findIndex((ep) => {
    const normalizedEp = ep.title?.toLowerCase().replace(/\s+/g, "-")
    const normalizedCurrent = currentEpisodeTitle?.toLowerCase().replace(/\s+/g, "-")
    return normalizedEp === normalizedCurrent
  })
  const newEpisodeId = currentEpisodeTitle?.toLowerCase().replace(/\s+/g, "-")

  const intervalRef = useRef(null)

  const skipFinalSaveRef = useRef(false)
  const storageKey = newEpisodeId ? `/erebus-empire/${animeId}/${seasonId}/${newEpisodeId}` : null

  const nextEpisode = currentEpisodes?.[currentSelectedLanguage]?.[episodeIndex + 1]
  const updatePresence = (title, episodeNumber, cover, currentTime, duration) => {
    const now = Date.now()
    const start = now - (currentTime || 0) * 1000
    const end = start + (duration || 0) * 1000
    window.electron.ipcRenderer.send("update-rich-presence", {
      anime: title,
      episode: episodeNumber,
      cover,
      startTimestamp: start,
      endTimestamp: end,
    })
  }
  const [availableLanguagesEpisode, setAvailableLanguagesEpisode] = useState(undefined)
  const buildWatchData = () => ({
    animeId,
    seasonId,
    episodeId: newEpisodeId,
    episodeTitle: currentEpisodeTitle,
    animeTitle: displayAnimeTitle,
    seasonTitle: currentSeasonTitle,
    animeCover: displayAnimeCover,
    timestamp: Date.now(),
    videoTime: videoTimeRef.current,
    videoDuration: videoDurationRef.current,
    seasonUrl: currentSeasonUrl,
    availableLanguages: currentAvailableLanguages,
    selectedLanguage: currentSelectedLanguage,
  })

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
  const EndEpisodeNext = async (episode) => {
    if (!episode) return
    await clearSeasonHistory()
    await animeData.save("animeWatchHistory", storageKey, buildWatchData())

    skipFinalSaveRef.current = true
    clearInterval(intervalRef.current)

    const nextId = `${episode.title.toLowerCase().replace(/\s+/g, "-")}`
    setCurrentEpisodeTitle(episode.title)
    setResolvedSources([])
    setEpisodeUrl(undefined)
    setEpisodeSources(episode)

    navigate(`/erebus-empire/${animeId}/${seasonId}/${nextId}`, {
      state: { ...location.state, episodeTitle: episode.title },
    })
  }

  const handleNavigation = async (episode) => {
    if (!episode) return

    await clearSeasonHistory()
    await animeData.save("animeWatchHistory", storageKey, buildWatchData())

    const navId = `${episode.title.toLowerCase().replace(/\s+/g, "-")}`
    setCurrentEpisodeTitle(episode.title)
    setResolvedSources([])
    setEpisodeUrl(undefined)
    setEpisodeSources(episode)

    navigate(`/erebus-empire/${animeId}/${seasonId}/${navId}`, {
      state: { ...location.state, episodeTitle: episode.title },
    })
  }

  const changeLanguage = (lang) => {
    const lower = lang?.toLowerCase()
    if (!lower || !currentEpisodes?.[lower]) return
    setCurrentSelectedLanguage(lower)

    const newEpisode = currentEpisodes[lower]?.[episodeIndex]
    if (!newEpisode) return

    setEpisodeSources(newEpisode)
    navigate(location.pathname, {
      replace: true,
      state: {
        ...location.state,
        selectedLanguage: lower,
      },
    })
  }
  const handleDownload = async () => {
    try {
      alert("Téléchargement commence")

      await window.electron.ipcRenderer.invoke("download-video", episodeUrl, {
        episodeTitle: currentEpisodeTitle,
        seasonTitle: currentSeasonTitle,
        animeTitle: displayAnimeTitle,
        animeCover: displayAnimeCover,
      })

      alert("Téléchargement terminé !")
    } catch (error) {
      console.error("Erreur lors du téléchargement de la vidéo :", error)
    }
  }
  const BackMenu = () => navigate("/erebus-empire/home")
  const BackSeason = () => navigate(`/erebus-empire/${animeId}/${seasonId}`)

  const handleVideoTimeUpdate = ({ currentTime, duration }) => {
    if (typeof currentTime === "number" && currentTime !== videoTime) {
      setVideoTime(currentTime)
    }
    if (typeof duration === "number" && duration !== videoDuration) {
      setVideoDuration(duration)
    }

    const now = Date.now()
    if (now - lastPresenceUpdateRef.current >= 5000 && duration) {
      lastPresenceUpdateRef.current = now
      updatePresence(
        displayAnimeTitle,
        `${currentSeasonTitle} - ${currentEpisodeTitle}`,
        displayAnimeCover,
        currentTime,
        duration,
      )
    }
  }
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
        if (!currentEpisodes) {
          if (chosenLang) {
            const eps = await window.electron.ipcRenderer.invoke(
              "get-episodes",
              `${BASE_URL}/catalogue/${animeId}/${seasonId}/${chosenLang}`,
              true,
            )
            setCurrentSeasonUrl(`${BASE_URL}/catalogue/${animeId}/${seasonId}/${chosenLang}`)
            const newEpisodes = { [chosenLang]: eps || [] }

            if (!currentEpisodeTitle && episodeId && newEpisodes[chosenLang]) {
              const ep = newEpisodes[chosenLang].find(
                (e) => e.title?.toLowerCase().replace(/\s+/g, "-") === episodeId,
              )
              if (ep) setCurrentEpisodeTitle(ep.title)
            }
            setCurrentEpisodes(newEpisodes)
          }
        }
      } catch (error) {
        console.error("Erreur dans le recalcul Episode:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!currentEpisodes || !currentAvailableLanguages || !currentEpisodeTitle) {
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
  useEffect(() => {
    videoTimeRef.current = videoTime
  }, [videoTime])

  useEffect(() => {
    let cancelled = false

    const resolveAllSources = async () => {
      if (!episodeSources?.url || !episodeSources?.host) return
      try {
        setLoading(true)
        const hosts = episodeSources.host || []
        const urls = episodeSources.url || []
        const resolvedUrls = []

        for (let i = 0; i < urls.length; i++) {
          const realUrl = await window.electron.ipcRenderer.invoke("get-url", urls[i], hosts[i])
          if (cancelled) return

          if (hosts[i] === "vidmoly" && realUrl != null) {
            resolvedUrls.push(realUrl.videoUrl)
            setOpeningTime(realUrl.openingTime)
          } else {
            resolvedUrls.push(realUrl)
          }
        }

        const filteredSources = []
        for (let i = 0; i < resolvedUrls.length; i++) {
          if (resolvedUrls[i]) {
            filteredSources.push({ url: resolvedUrls[i], host: hosts[i] })
          }
        }

        if (cancelled) return
        const updatedSources = {
          ...episodeSources,
          url: filteredSources.map((s) => s.url),
          host: filteredSources.map((s) => s.host),
        }
        setResolvedSources(updatedSources)
        const working = filteredSources[0]?.url || null
        setEpisodeUrl(working)
      } catch (err) {
        if (!cancelled) console.error("Erreur lors de la résolution des sources :", err)
      } finally {
        setLoading(false)
      }
    }

    resolveAllSources()

    return () => {
      cancelled = true
    }
  }, [episodeSources, currentSelectedLanguage])

  useEffect(() => {
    skipFinalSaveRef.current = false
  }, [storageKey])

  useEffect(() => {
    if (!currentEpisodes || !currentAvailableLanguages) return

    const EpisodeLanguages = currentAvailableLanguages.filter((lang) => {
      const epList = currentEpisodes[lang.toLowerCase()]
      return epList && episodeIndex != null && episodeIndex !== -1 && epList[episodeIndex]?.title
    })

    setAvailableLanguagesEpisode(EpisodeLanguages)

    if (
      currentSelectedLanguage &&
      episodeIndex !== -1 &&
      currentEpisodes[currentSelectedLanguage] &&
      currentEpisodes[currentSelectedLanguage][episodeIndex]
    ) {
      setEpisodeSources(currentEpisodes[currentSelectedLanguage][episodeIndex])
    }
  }, [currentSelectedLanguage, episodeIndex, currentEpisodes, currentAvailableLanguages])

  useEffect(() => {
    if (location.state?.episodeTitle && location.state.episodeTitle !== currentEpisodeTitle) {
      setCurrentEpisodeTitle(location.state.episodeTitle)
      return
    }

    if (episodeId) {
      const langToCheck =
        currentSelectedLanguage || (currentAvailableLanguages && currentAvailableLanguages[0])
      if (langToCheck && currentEpisodes) {
        let found
        if (currentEpisodes.title?.toLowerCase().replace(/\s+/g, "-") === episodeId) {
          found = currentEpisodes
        }
        if (found && found.title !== currentEpisodeTitle) {
          setCurrentEpisodeTitle(found.title)
          return
        }
      }

      if (!currentEpisodes) {
        setCurrentEpisodeTitle("")
      }
    }
  }, [
    episodeId,
    location.state?.episodeTitle,
    currentEpisodes,
    currentSelectedLanguage,
    currentAvailableLanguages,
  ])
  useEffect(() => {
    if (!storageKey) return
    animeData.load("animeWatchHistory", storageKey).then((data) => {
      const time = parseFloat(data?.videoTime || 0)
      setVideoTime(time)
      videoTimeRef.current = time
      setRestored(true)
    })
  }, [storageKey])
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
      animeData.save("animeWatchHistory", storageKey, buildWatchData())
    }, 5000)

    return () => {
      clearInterval(intervalRef.current)
      if (!skipFinalSaveRef.current) {
        animeData.save("animeWatchHistory", storageKey, buildWatchData())
      }
    }
  }, [restored, storageKey])
  if (loading || !restored) {
    return <Loader />
  }
  return (
    <ErebusPlayer
      src={episodeUrl}
      overlayEnabled={true}
      cover={displayAnimeCover}
      title={displayAnimeTitle}
      subTitle={`${currentSeasonTitle} - ${currentEpisodeTitle}`}
      titleMedia={`${displayAnimeTitle} : ${currentSeasonTitle} - ${currentEpisodeTitle}`}
      autoControllCloseEnabled={true}
      fullPlayer={true}
      autoPlay={true}
      startPosition={videoTime}
      openingTime={openingTime}
      onEnded={() => nextEpisode && EndEpisodeNext(nextEpisode)}
      dataNext={
        nextEpisode
          ? {
              id: nextEpisode.title.toLowerCase().replace(/\s+/g, "-"),
              title: nextEpisode.title,
            }
          : null
      }
      onNextClick={() => nextEpisode && EndEpisodeNext(nextEpisode)}
      onClickItemListReproduction={(slug) => {
        const lang =
          currentSelectedLanguage || (currentAvailableLanguages && currentAvailableLanguages[0])
        const episode = currentEpisodes?.[lang]?.find(
          (ep) => ep.title.toLowerCase().replace(/\s+/g, "-") === slug,
        )
        if (episode) handleNavigation(episode)
      }}
      reprodutionList={currentEpisodes?.[currentSelectedLanguage]?.map((ep) => ({
        id: ep.title.toLowerCase().replace(/\s+/g, "-"),
        name: ep.title,
        playing:
          ep.title.toLowerCase().replace(/\s+/g, "-") ===
          currentEpisodeTitle.toLowerCase().replace(/\s+/g, "-"),
      }))}
      onTimeUpdate={handleVideoTimeUpdate}
      onCrossClick={BackMenu}
      backButton={BackSeason}
      onDownloadClick={handleDownload}
      episodeSources={resolvedSources}
      availableLanguages={availableLanguagesEpisode}
      currentLanguage={currentSelectedLanguage}
      onChangeLanguage={changeLanguage}
    />
  )
}
