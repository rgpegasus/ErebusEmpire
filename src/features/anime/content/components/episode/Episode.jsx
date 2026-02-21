import React, { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useLoader, Loader } from "@utils/dispatchers/Page"
import { ErebusPlayer } from "@components/video-player/VideoPlayer"

export const Episode = ({
  animeId,
  seasonId,
  episodeId,
  animeCover,
  seasonUrl,
  animeTitle,
  seasonTitle,
  episodeTitle,
  episodeIndex,
  availableLanguages,
  getEpisodeTitle,
  getWatchDataRef,
  getContents,
  getAvailableLanguages,
  contents,
  getRestored,
  restored,
  storageKey,
  clearSeasonHistory,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [videoDuration, setVideoDuration] = useState(0)
  const [episodeUrl, setEpisodeUrl] = useState(undefined)
  const [resolvedSources, setResolvedSources] = useState([])
  const { loading, setLoading } = useLoader()
  const [openingTime, setOpeningTime] = useState([0, 0])
  const [episodeSources, setEpisodeSources] = useState(null)
  const [videoTime, setVideoTime] = useState(0)
  const lastPresenceUpdateRef = useRef(0)
  const [availableLanguagesEpisode, setAvailableLanguagesEpisode] = useState(undefined)

  const newEpisodeId = episodeTitle?.toLowerCase().replace(/\s+/g, "-")

  const intervalRef = useRef(null)

  const [selectedLanguage, setSelectedLanguage] = useState(location.state?.selectedLanguage || null)
  const skipFinalSaveRef = useRef(false)

  const nextEpisode = contents?.[selectedLanguage]?.[episodeIndex + 1]
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
  useEffect(() => {
    return () => {
      window.electron.ipcRenderer.send("defaul-rich-presence")
    }
  }, [])
  const buildWatchData = () => ({
    animeId,
    seasonId,
    episodeId: newEpisodeId,
    episodeTitle,
    animeTitle,
    seasonTitle,
    animeCover,
    timestamp: Date.now(),
    videoTime,
    videoDuration,
    seasonUrl,
    availableLanguages,
    selectedLanguage,
    contentType:"anime",
  })
  useEffect(() => {
    if (
      animeId &&
      seasonId &&
      episodeId &&
      episodeTitle &&
      seasonTitle &&
      animeTitle &&
      animeCover &&
      seasonUrl &&
      availableLanguages &&
      selectedLanguage
    ) {
      getWatchDataRef(buildWatchData())
    }
  }, [
    animeId,
    seasonId,
    episodeId,
    episodeTitle,
    seasonTitle,
    animeTitle,
    animeCover,
    seasonUrl,
    videoTime,
    availableLanguages,
    selectedLanguage,
  ])
  const EndEpisodeNext = async (episode) => {
    if (!episode) return
    await clearSeasonHistory()
    await animeData.save("animeWatchHistory", storageKey, buildWatchData())

    skipFinalSaveRef.current = true
    clearInterval(intervalRef.current)

    const nextId = `${episode.title.toLowerCase().replace(/\s+/g, "-")}`
    getEpisodeTitle(episode.title)
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
    getEpisodeTitle(episode.title)
    setResolvedSources([])
    setEpisodeUrl(undefined)
    setEpisodeSources(episode)

    navigate(`/erebus-empire/${animeId}/${seasonId}/${navId}`, {
      state: { ...location.state, episodeTitle: episode.title },
    })
  }

  const changeLanguage = (lang) => {
    const lower = lang?.toLowerCase()
    if (!lower || !contents?.[lower]) return
    setSelectedLanguage(lower)

    const newEpisode = contents[lower]?.[episodeIndex]
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
        episodeTitle,
        seasonTitle,
        animeTitle,
        animeCover,
        seasonUrl,
      })

      alert("Téléchargement terminé !")
    } catch (error) {
      console.error("Erreur lors du téléchargement de la vidéo :", error)
      alert("Erreur lors du téléchargement")
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
        animeTitle,
        `${seasonTitle} - ${episodeTitle}`,
        animeCover,
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
        let chosenLang = selectedLanguage || ""
        if (!chosenLang) {
          chosenLang = seasonUrl.split("/").slice(6, 7).join("/")
          setSelectedLanguage(chosenLang)
        }
        if ((!availableLanguages || (Array.isArray(availableLanguages) && availableLanguages.length === 0)) || !chosenLang) {
          const langs = await window.electron.ipcRenderer.invoke(
            "get-available-languages",
            `${BASE_URL}/catalogue/${animeId}/${seasonId}/${selectedLanguage}`,
          )
          const normalizedLangs = (langs || []).map((lang) => String(lang).toLowerCase())
          getAvailableLanguages(normalizedLangs)

          if (!chosenLang && normalizedLangs.length > 0) {
            chosenLang = normalizedLangs[0]
            seasonUrl = `${seasonUrl}/${chosenLang}`
            setSelectedLanguage(chosenLang)
          }
        }
        if ((!contents || (contents && Object.keys(contents).length === 0)) && chosenLang) {
          const eps = await window.electron.ipcRenderer.invoke(
            "get-episodes",
            `${BASE_URL}/catalogue/${animeId}/${seasonId}/${chosenLang}`,
            true,
          )
          if (!episodeTitle && episodeId && eps) {
            const ep = eps.find(
              (e) => e.title?.toLowerCase().replace(/\s+/g, "-") === episodeId,
            )
            if (ep) getEpisodeTitle(ep.title)
          }
          getContents({[chosenLang]: eps || [] })
        }
      } catch (error) {
        console.error("Erreur dans le recalcul Episode:", error)
      } finally {
        setLoading(false)
      }
    }
    if (!contents || (contents && Object.keys(contents).length === 0) || !selectedLanguage) {
      fetchMissingData()
    }
  }, [animeId, seasonId, episodeId, selectedLanguage])

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
  }, [episodeSources, selectedLanguage])

  useEffect(() => {
    skipFinalSaveRef.current = false
  }, [storageKey])

  useEffect(() => {
    if (!contents || !availableLanguages) return
    if (
      Object.keys(contents).length === 0 ||
      (Array.isArray(availableLanguages) && availableLanguages.length === 0)
    )
      return
    const EpisodeLanguages = availableLanguages.filter((lang) => {
      const epList = contents[lang.toLowerCase()]
      return epList && episodeIndex != null && episodeIndex !== -1 && epList[episodeIndex]?.title
    })

    setAvailableLanguagesEpisode(EpisodeLanguages)
    if (
      selectedLanguage &&
      episodeIndex !== -1 &&
      contents[selectedLanguage] &&
      contents[selectedLanguage][episodeIndex]
    ) {
      setEpisodeSources(contents[selectedLanguage][episodeIndex])
    }
  }, [selectedLanguage, episodeIndex, contents, availableLanguages])

  useEffect(() => {
    if (location.state?.episodeTitle && location.state.episodeTitle !== episodeTitle) {
      getEpisodeTitle(location.state.episodeTitle)
      return
    }
    if (episodeId) {
      const langToCheck = selectedLanguage || (availableLanguages && availableLanguages[0])
      if (langToCheck && contents) {
        let found
        if (contents.title?.toLowerCase().replace(/\s+/g, "-") === episodeId) {
          found = contents
        }
        if (found && found.title !== episodeTitle) {
          getEpisodeTitle(found.title)
          return
        }
      }

      if (!contents) {
        getEpisodeTitle("")
      }
    }
  }, [
    episodeId,
    location.state?.episodeTitle,
    contents,
    selectedLanguage,
    availableLanguages,
  ])
  useEffect(() => {
    if (!storageKey) return
    animeData.load("animeWatchHistory", storageKey).then((data) => {
      const time = parseFloat(data?.videoTime || 0)
      setVideoTime(time)
      getRestored(true)
    })
  }, [storageKey])

  if (loading || !restored) {
    return <Loader />
  }
  return (
    <ErebusPlayer
      src={episodeUrl}
      overlayEnabled={true}
      cover={animeCover}
      title={animeTitle}
      subTitle={`${seasonTitle} - ${episodeTitle}`}
      titleMedia={`${animeTitle} : ${seasonTitle} - ${episodeTitle}`}
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
        const lang = selectedLanguage || (availableLanguages && availableLanguages[0])
        const episode = contents?.[lang]?.find(
          (ep) => ep.title.toLowerCase().replace(/\s+/g, "-") === slug,
        )
        if (episode) handleNavigation(episode)
      }}
      reprodutionList={contents?.[selectedLanguage]?.map((ep) => ({
        id: ep.title.toLowerCase().replace(/\s+/g, "-"),
        name: ep.title,
        playing:
          ep.title.toLowerCase().replace(/\s+/g, "-") ===
          episodeTitle.toLowerCase().replace(/\s+/g, "-"),
      }))}
      onTimeUpdate={handleVideoTimeUpdate}
      onCrossClick={BackMenu}
      backButton={BackSeason}
      onDownloadClick={handleDownload}
      episodeSources={resolvedSources}
      availableLanguages={availableLanguagesEpisode}
      currentLanguage={selectedLanguage}
      onChangeLanguage={changeLanguage}
    />
  )
}
