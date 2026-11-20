import { toSlug } from "@utils/functions/toSlug"
import { animeData } from "@services/data/animeRepository"
import React, { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useLoader } from "@context/loader-context/LoaderContext"
import { Loader } from "@features/loader/Loader"
import { ErebusPlayer } from "@components/video-player/VideoPlayer"
import { getSkipTimes } from "@utils/functions/getSkipTimes"
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
  animeMalId,
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
  const { setLoading } = useLoader()
  const [openingTime, setOpeningTime] = useState([0, 0])
  const [episodeSources, setEpisodeSources] = useState(null)
  const [videoTime, setVideoTime] = useState(0)
  const lastPresenceUpdateRef = useRef(0)
  const [availableLanguagesEpisode, setAvailableLanguagesEpisode] = useState(undefined)
  const [resolveFailed, setResolveFailed] = useState(false)
  const newEpisodeId = toSlug(episodeTitle)
  const intervalRef = useRef(null)

  const [selectedLanguage, setSelectedLanguage] = useState(location.state?.selectedLanguage || null)
  const skipFinalSaveRef = useRef(false)

  const nextEpisode = contents?.[selectedLanguage]?.[episodeIndex + 1]
  const updatePresence = (title, episodeNumber, cover, currentTime, duration) => {
    const now = Date.now()
    const start = now - (currentTime || 0) * 1000
    const end = start + (duration || 0) * 1000
    window.api.send("update-rich-presence", {
      anime: title,
      episode: episodeNumber,
      cover,
      startTimestamp: start,
      endTimestamp: end,
    })
  }
  useEffect(() => {
    return () => {
      window.api.send("default-rich-presence")
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
    contentType: "anime",
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
    videoDuration,
    availableLanguages,
    selectedLanguage,
  ])
  useEffect(() => {
    const getOpeningTime  = async () => {const skipTimes = await getSkipTimes(animeMalId, seasonId, episodeId, videoDuration)
    const op = skipTimes?.find(s => s.skipType === "op" || s.skipType === "mixed-op")?.interval
    setOpeningTime(op ? [op.startTime, op.endTime] : [0, 0])
    }
    if(videoDuration == 0) return
    getOpeningTime()
  }, [videoDuration])
  const EndEpisodeNext = async (episode) => {
    if (!episode) return
    await animeData.save("animeWatchHistory", storageKey, buildWatchData())
    await clearSeasonHistory(storageKey)

    skipFinalSaveRef.current = true
    clearInterval(intervalRef.current)

    const nextId = `${toSlug(episode.title)}`
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

    await animeData.save("animeWatchHistory", storageKey, buildWatchData())
    await clearSeasonHistory(storageKey)

    const navId = `${toSlug(episode.title)}`
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

      await window.api.invoke("download-video", episodeUrl, {
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
  if (typeof currentTime === "number" && Math.abs(currentTime - videoTime) >= 5) {
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
        const BASE_URL = await window.api.invoke("get-working-url")
        let chosenLang = selectedLanguage || ""
        if (!chosenLang) {
          chosenLang = seasonUrl.split("/").slice(6, 7).join("/")
          setSelectedLanguage(chosenLang)
        }
        if (
          !availableLanguages ||
          (Array.isArray(availableLanguages) && availableLanguages.length === 0) ||
          !chosenLang
        ) {
          const langs = await window.api.invoke(
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
          const eps = await window.api.invoke(
            "get-episodes",
            `${BASE_URL}/catalogue/${animeId}/${seasonId}/${chosenLang}`,
            true,
          )
          if (!episodeTitle && episodeId && eps) {
            const ep = eps.find((e) => toSlug(e.title) === episodeId)
            if (ep) getEpisodeTitle(ep.title)
          }
          getContents({ [chosenLang]: eps || [] })
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
    if (!episodeSources?.url || !episodeSources?.host) return
    let cancelled = false
    ;(async () => {
      setLoading(true); 
      setResolveFailed(false)
      try {
        const resolved = await window.api.invoke("resolve-sources", {
          url: episodeSources.url,
          host: episodeSources.host,
        })
        if (cancelled) return
        setResolvedSources({
          ...episodeSources,
          url: resolved.map((r) => r.url),
          host: resolved.map((r) => r.host),
        })
        setEpisodeUrl(resolved[0]?.url ?? null)
      } catch (err) {
        if (!cancelled) {
          console.error("Erreur lors de la résolution des sources :", err)
          setResolveFailed(true)
        }
      } finally {
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
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
        if (toSlug(contents.title) === episodeId) {
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
  }, [episodeId, location.state?.episodeTitle, contents, selectedLanguage, availableLanguages])
  useEffect(() => {
    if (!storageKey) return
    animeData.load("animeWatchHistory", storageKey).then((data) => {
      const time = parseFloat(data?.videoTime || 0)
      setVideoTime(time > 5 ? time - 5 : 0)
      getRestored(true)
    })
  }, [storageKey])

  if (!restored || (!episodeUrl && !resolveFailed)) {
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
              id: toSlug(nextEpisode.title),
              title: nextEpisode.title,
            }
          : null
      }
      onNextClick={() => nextEpisode && EndEpisodeNext(nextEpisode)}
      onClickItemListReproduction={(slug) => {
        const lang = selectedLanguage || (availableLanguages && availableLanguages[0])
        const episode = contents?.[lang]?.find(
          (ep) => toSlug(ep.title) === slug,
        )
        if (episode) handleNavigation(episode)
      }}
      reprodutionList={contents?.[selectedLanguage]?.map((ep) => ({
        id: toSlug(ep.title),
        name: ep.title,
        playing:
          toSlug(ep.title) ===
          toSlug(episodeTitle),
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
