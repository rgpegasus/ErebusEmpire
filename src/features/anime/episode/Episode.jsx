import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLoader, Loader } from '@utils/dispatchers/Page';
import { ErebusPlayer } from '@components/video-player/VideoPlayer';

export const Episode = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { animeId: urlAnimeId, seasonId: urlSeasonId, episodeId: urlEpisodeId } = useParams()

  let {
    episodeTitle = "",
    episodes = null,
    animeId = urlAnimeId,
    seasonId = urlSeasonId,
    animeTitle = "",
    seasonTitle = "",
    animeCover = "",
    seasonUrl = "",
    availableLanguages = null,
    selectedLanguage = "",
    scans = [],
  } = location.state || {}
  const [currentEpisodeTitle, setCurrentEpisodeTitle] = useState(location.state?.episodeTitle || "")
  const [currentEpisodes, setCurrentEpisodes] = useState(location.state?.episodes || null)
  const [currentSeasonUrl, setCurrentSeasonUrl] = useState(location.state?.seasonUrl || "")
  const [currentAvailableLanguages, setCurrentAvailableLanguages] = useState(
    location.state?.availableLanguages || null,
  )
  const [currentSelectedLanguage, setCurrentSelectedLanguage] = useState(
    location.state?.selectedLanguage || "",
  )
  const [imgScans, setImgScans] = useState(
    location.state?.scans || [],
  )
  const [currentSeasonTitle, setCurrentSeasonTitle] = useState(location.state?.seasonTitle || "")
  const [animeInfo, setAnimeInfo] = useState({})
  const { loading, setLoading } = useLoader()
  const [episodeSources, setEpisodeSources] = useState(null)
  const [episodeUrl, setEpisodeUrl] = useState(undefined)
  const [availableLanguagesEpisode, setAvailableLanguagesEpisode] = useState(undefined)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoTime, setVideoTime] = useState(0)
  const [restored, setRestored] = useState(false)
  const intervalRef = useRef(null)
  const skipFinalSaveRef = useRef(false)
  const videoTimeRef = useRef(videoTime)
  const [resolvedSources, setResolvedSources] = useState([])
  const lastPresenceUpdateRef = useRef(0)
  const [openingTime, setOpeningTime] = useState([0, 0])

  const containerRef = useRef(null)
  const zoomRef = useRef(null)
  const [widthPercent, setWidthPercent] = useState(100)
  const videoDurationRef = useRef(0)

  useEffect(() => {
    videoDurationRef.current = videoDuration
  }, [videoDuration])
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

  const displayAnimeTitle = animeInfo?.title || animeTitle || ""
  const displayAnimeCover = animeInfo?.cover || animeCover || ""

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
          if (info) setAnimeInfo(info)
        }
        if (!seasonTitle) {
          const result = await window.electron.ipcRenderer.invoke(
            "get-seasons",
            `${BASE_URL}/catalogue/${animeId}/`,
          )
          
          const currentSeason = result.seasons.find((s) => s.url.split("/")[5] === seasonId)
          setCurrentSeasonTitle(currentSeason.title)
          if (currentSeason.title.toLowerCase().includes("scan")) {
            const language = currentSeason.title.split("/").slice(6, 7).join("/")
            setCurrentAvailableLanguages([language])
            setCurrentSelectedLanguage(language)
            setCurrentSeasonUrl(currentSeason.url)
            const scansLinks = await window.electron.ipcRenderer.invoke(
              "get-scans-chapter",
              currentSeason.url,
            )
            const currentEpisode = Object.entries(scansLinks).find(
              ([_, e]) =>
                e.title?.toLowerCase().replace(/\s+/g, "-") ===
                location.pathname.split("/").slice(4, 5).join("/"),
            )[0]
            console.log(currentSeason.url, currentEpisode)
            setCurrentEpisodeTitle(currentEpisode)
            const scansImg = await window.electron.ipcRenderer.invoke(
              "get-scans-img",
              currentSeason.url,
              currentEpisode,
            )
            setImgScans(scansImg)
            return  
          }
        }
        let chosenLang = currentSelectedLanguage

        if (!currentAvailableLanguages) {
          const langs = await window.electron.ipcRenderer.invoke(
            "get-available-languages",
            `${BASE_URL}/catalogue/${animeId}/${seasonId}/`,
          )
          const normalizedLangs = (langs || []).map((lang) => String(lang).toLowerCase())
          setCurrentAvailableLanguages(normalizedLangs)

          if (!chosenLang && normalizedLangs.length > 0) {
            chosenLang = normalizedLangs[0]
            setCurrentSelectedLanguage(chosenLang)
          }
        }
        if (!currentEpisodes) {
          const langToUse = chosenLang || currentSelectedLanguage
          if (langToUse) {
            const eps = await window.electron.ipcRenderer.invoke(
              "get-episodes",
              `${BASE_URL}/catalogue/${animeId}/${seasonId}/${langToUse}`,
              true,
            )
            setCurrentSeasonUrl(`${BASE_URL}/catalogue/${animeId}/${seasonId}/${langToUse}`)
            const newEpisodes = { [langToUse]: eps || [] }

            if (!currentEpisodeTitle && urlEpisodeId && newEpisodes[langToUse]) {
              const ep = newEpisodes[langToUse].find(
                (e) => e.title?.toLowerCase().replace(/\s+/g, "-") === urlEpisodeId,
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

    if (
      (!currentEpisodes && !imgScans.length) ||
      !currentAvailableLanguages ||
      !currentEpisodeTitle
    ) {
      fetchMissingData()
    }
  }, [
    animeId,
    seasonId,
    urlEpisodeId,
    currentEpisodes,
    currentAvailableLanguages,
    currentSelectedLanguage,
  ])
  
  const episodeIndex = currentEpisodes?.[currentSelectedLanguage]?.title?.findIndex((ep) => {
    const normalizedEp = ep?.toLowerCase().replace(/\s+/g, "-")
    const normalizedCurrent = currentEpisodeTitle?.toLowerCase().replace(/\s+/g, "-")

    return normalizedEp === normalizedCurrent
  })
  
  
      
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

    if (urlEpisodeId) {
      const langToCheck =
        currentSelectedLanguage || (currentAvailableLanguages && currentAvailableLanguages[0])
      if (langToCheck && currentEpisodes) {
        let found;
        if ( currentEpisodes.title?.toLowerCase().replace(/\s+/g, "-") === urlEpisodeId ) {
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
    urlEpisodeId,
    location.state?.episodeTitle,
    currentEpisodes,
    currentSelectedLanguage,
    currentAvailableLanguages,
  ])

  const nextEpisode = currentEpisodes?.[currentSelectedLanguage]?.[episodeIndex + 1]
  const prevChapter = currentEpisodes?.[currentSelectedLanguage]?.[episodeIndex - 1]
  const nextChapter = currentEpisodes?.[currentSelectedLanguage]?.[episodeIndex + 1]

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

  const episodeId = currentEpisodeTitle?.toLowerCase().replace(/\s+/g, "-")
  const storageKey = episodeId ? `/erebus-empire/${animeId}/${seasonId}/${episodeId}` : null

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
        
          if (hosts[i] === "vidmoly" && realUrl!=null) {
            
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
        if (!cancelled) setLoading(false)
      }
    }

    resolveAllSources()

    return () => {
      cancelled = true
    }
  }, [episodeSources, currentSelectedLanguage])
  
  useEffect(() => {
    videoTimeRef.current = videoTime
  }, [videoTime])

  const buildWatchData = () => ({
    animeId,
    seasonId,
    episodeId,
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
    skipFinalSaveRef.current = false
  }, [storageKey])

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
  if (currentSeasonUrl.includes("scan")) {
    return (
      <div className="MainPage">
        <div onClick={() => prevChapter && handleChapterNavigation(prevChapter)}>Précédent</div>
        <div onClick={() => nextChapter && handleChapterNavigation(nextChapter)}>Suivant</div>
        <div className="ScansPage" ref={zoomRef}>
          <div className="ScansContainer" ref={containerRef}>
            {imgScans.map((img, idx) => (
              <img key={idx} className="ImgScans" src={img} alt={`scan-${idx}`} />
            ))}
          </div>
        </div>
      </div>
    )
  }

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
};
