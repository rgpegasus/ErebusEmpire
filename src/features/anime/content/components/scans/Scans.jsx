import React, { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useLoader, Loader } from "@utils/dispatchers/Page"
import styles from "./Scans.module.css"
import { ArrowIcon } from "@utils/dispatchers/Icons"

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
  getContents,
  getAvailableLanguages,
  contents,
  getRestored,
  getEpisodeIndex,
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { loading, setLoading } = useLoader()

  const zoomRef = useRef(null)
  const containerRef = useRef(null)
  const [imgScans, setImgScans] = useState(location.state?.scans || [])
  const [chapterId, setChapterId] = useState(location.state?.chapterId || null)

  const [widthPercent, setWidthPercent] = useState(100)
  const [prevChapter, setPrevChapter] = useState(
    contents?.[selectedLanguage]?.[episodeIndex - 1] || {},
  )
  const [nextChapter, setNextChapter] = useState(
    contents?.[selectedLanguage]?.[episodeIndex + 1] || {},
  )
  const isValidIndex  = (index) => {
    return index && Array.isArray(index)
                ? index.length > 0
                : Object.keys(index).length > 0
  } 
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
    contentType: "manga",
  })
  useEffect(() => {
    const fetchMissingData = async () => {
      try {
        setLoading(true)

        if (!availableLanguages || (Array.isArray(availableLanguages) && availableLanguages.length === 0)) {
          getAvailableLanguages([selectedLanguage])
        }
        const chapterTempLink = await window.electron.ipcRenderer.invoke(
          "get-scans-chapter",
          seasonUrl,
        )
        const chapterLink = chapterTempLink?.scans.map((chap, index) => ({
          id: index,
          numberImg: chap.numberImg,
          title: chap.title,
        }))
        const currentChapter = chapterLink.find((ep) => {
          return ep?.title?.toLowerCase().replace(/\s+/g, "-") === location.pathname.split("/")[4]
        })

        getContents({ [selectedLanguage]: chapterLink })
        const prev = chapterLink.find((ep) => {
          return ep?.id === episodeIndex - 1
        })
        if (prev) {
          setPrevChapter(prev)
        } else {
          setPrevChapter({})
        }
        const next = chapterLink.find((ep) => {
          return ep?.id === episodeIndex + 1
        })
        if (next) {
          setNextChapter(next)
        } else {
          setNextChapter({})
        }

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

    if (
      !contents ||
      imgScans?.length <= 0 ||
      !availableLanguages ||
      (Array.isArray(availableLanguages) && availableLanguages.length === 0)
    ) {
      fetchMissingData()
    }
  }, [animeId, seasonId, episodeId, contents, availableLanguages, selectedLanguage])

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

  const handleChapterNavigation = (chapter, newIndex) => {
    getEpisodeTitle(chapter.title)
    getEpisodeIndex(newIndex)
    const chapterId = chapter.title?.toLowerCase().replace(/\s+/g, "-")
    setImgScans([])
    navigate(`/erebus-empire/${animeId}/${seasonId}/${chapterId}`, {
      state: {
        ...location.state,
        scans: [],
        chapterId: chapter.id,
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
      <div className={styles.NavigationContainer}>
        <div className={styles.NavigationBox}>
          <div
            className={`${styles.Navigation} ${isValidIndex(prevChapter) ? styles.Activate : styles.Desactivate}`}
            onClick={() =>
              isValidIndex(prevChapter) && handleChapterNavigation(prevChapter, episodeIndex - 1)
            }
          >
            <ArrowIcon className={styles.ArrowIconLeft} />
          </div>
          <div className={styles.ChapterTitle}>{episodeTitle}</div>
          <div
            className={`${styles.Navigation} ${isValidIndex(nextChapter) ? styles.Activate : styles.Desactivate}`}
            onClick={() =>
              isValidIndex(nextChapter) && handleChapterNavigation(nextChapter, episodeIndex + 1)
            }
          >
            <ArrowIcon className={styles.ArrowIconRight} />
          </div>
        </div>
      </div>
    </div>
  )
}
