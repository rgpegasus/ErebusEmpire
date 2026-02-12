import React, { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useLoader, Loader } from "@utils/dispatchers/Page"

export const Scans = ({
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
  selectedLanguage,
  getEpisodeTitle,
  getWatchDataRef,
  getCurrentEpisodes,
  getAvailableLanguages,
  currentEpisodes,
  getRestored,
}) => {
  const location = useLocation()
  const { loading, setLoading } = useLoader()

  const zoomRef = useRef(null)
  const containerRef = useRef(null)
  const [imgScans, setImgScans] = useState(location.state?.scans || [])
  const [chapterId, setChapterId] = useState(location.state?.chapterId || null)

  const [widthPercent, setWidthPercent] = useState(100)
  const prevChapter = currentEpisodes?.[selectedLanguage]?.[episodeIndex - 1]
  const nextChapter = currentEpisodes?.[selectedLanguage]?.[episodeIndex + 1]
  const buildWatchData = () => ({
    animeId,
    seasonId,
    episodeId,
    chapterId,
    episodeTitle,
    animeTitle,
    seasonTitle,
    animeCover,
    timestamp: Date.now(),
    seasonUrl,
    availableLanguages,
    selectedLanguage,
  })
  useEffect(() => {
    const fetchMissingData = async () => {
      try {
        setLoading(true)

        if (!availableLanguages) {
          getAvailableLanguages([selectedLanguage])
        }
        const chapterTempLink = await window.electron.ipcRenderer.invoke(
          "get-scans-chapter",
          seasonUrl,
        )
        const currentChapter = chapterTempLink?.scans.map((chap, index) =>
          ({
            id: index,
            numberImg: chap.numberImg,
            title: chap.title,
          })
        ).find((ep) => {
          return ep?.title?.toLowerCase().replace(/\s+/g, "-") === location.pathname.split("/")[4]
        })
          
        getCurrentEpisodes(currentChapter)
        // console.log(currentEpisode.title, seasonUrl)
        getEpisodeTitle(currentChapter?.title)
        setChapterId(currentChapter?.id)
        const scansImg = await window.electron.ipcRenderer.invoke(
          "get-scans-img",
          seasonUrl,
          currentChapter?.id,
          currentChapter?.numberImg,
          currentChapter?.encodedTitle,
        )
        setImgScans(scansImg)
        return
      } catch (error) {
        console.error("Erreur dans le recalcul Episode:", error)
      } finally {
        setLoading(false)
        getRestored(true)
      }
    }

    if (!currentEpisodes || imgScans?.length <= 0 || !availableLanguages) {
      // console.log(currentEpisodes,imgScans.length, availableLanguages,episodeTitle)
      fetchMissingData()
    }
  }, [animeId, seasonId, episodeId, currentEpisodes, availableLanguages, selectedLanguage])

  useEffect(() => {
    getWatchDataRef(buildWatchData())
  }, [
    animeId,
    seasonId,
    episodeId,
    chapterId,
    episodeTitle,
    seasonTitle,
    animeTitle,
    animeCover,
    seasonUrl,
    availableLanguages,
    selectedLanguage,
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

    getEpisodeTitle(chapter.title)
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

  const updatePresence = (title, episodeNumber, cover) => {
    window.electron.ipcRenderer.send("scan-discord-presence", {
      anime: title,
      episode: episodeNumber,
      cover,
    })
  }
  useEffect(() => {
    return () => {
      window.electron.ipcRenderer.send("defaul-rich-presence")
    }
  }, [])
  if (loading) {
    return <Loader />
  }
  updatePresence(animeTitle, episodeTitle, animeCover)
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
