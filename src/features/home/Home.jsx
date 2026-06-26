import React, { useEffect, useState, useContext } from "react"
import styles from "./Home.module.css"
import { useLoader } from "@utils/dispatchers/Page"
import BackgroundCover from "@components/background-cover/BackgroundCover"
import LatestReleases from "./components/LatestReleases"
import WatchHistory from "./components/WatchHistory"
import { UserContext } from '@context/user-context/UserContext';

export const Home = () => {
  const { favoriteLanguage } = useContext(UserContext);
  const [coverInfo, setCoverInfo] = useState(null)
  const [latestReleases, setLatestReleases] = useState([])
  const { setLoading } = useLoader()
  const [contentType, setContentType] = useState("anime")
  const [availableContentTypes, setAvailableContentTypes] = useState({
    hasAnime: false,
    hasManga: false,
  })
  const [latestEpisodes, setLatestEpisodes] = useState([])
  const [latestScans, setLatestScans] = useState([])
  const [latestEpisodesByLanguage, setLatestEpisodesByLanguage] = useState({})
  const [availableLanguages, setAvailableLanguages] = useState([])
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const filterValidUrls = async (items) => {
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          const res = await fetch(item.url, { method: "HEAD" })
          return res.ok ? item : null
        } catch {
          return null
        }
      }),
    )
    return results.filter(Boolean)
  }
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        let animeData = null
        if (!animeData) {
          const animeInfo = await window.electron.ipcRenderer.invoke("random-anime")
          animeCover.save(animeInfo)
          setCoverInfo(animeInfo)
        } else {
          setCoverInfo(animeData)
        }

        const episodes = await window.electron.ipcRenderer.invoke("get-latest-episode")
        const filteredEpisodes = await filterValidUrls(episodes)

        const tempEpisodes = {}
        const tempLanguages = []

        for (const episode of filteredEpisodes) {
          const lang = episode.language?.toLowerCase() || "vf"

          if (!tempLanguages.includes(lang)) {
            tempLanguages.push(lang)
          }

          tempEpisodes[lang] ??= []
          tempEpisodes[lang].push(episode)
        }
        tempLanguages.sort((a, b) => {
          if (favoriteLanguage) {
            if (a === favoriteLanguage) return -1
            if (b === favoriteLanguage) return 1
          }

          return tempEpisodes[b].length - tempEpisodes[a].length
        })

        setLatestEpisodesByLanguage(tempEpisodes)
        setAvailableLanguages(tempLanguages)

        if (tempLanguages.length > 0) {
          setSelectedLanguage(tempLanguages[0])
        }

        const scans = await window.electron.ipcRenderer.invoke("get-latest-scans")     
        const filteredScans = await filterValidUrls(scans)

        if (tempLanguages.length > 0) {
          setLatestReleases(tempEpisodes[tempLanguages[0]])
        } else {
          setLatestReleases(filteredScans)
        }
        setLatestEpisodes(tempEpisodes)
        setLatestScans(filteredScans)
        setAvailableContentTypes({
          hasAnime: filteredEpisodes.length > 0,
          hasManga: filteredScans.length > 0,
        })
      } catch (err) {
        console.error("Erreur lors du chargement:", err)
      } finally {
        setLoading(false)

      }
    }

    fetchData()
  }, []) 

  const handleContentTypeChange = (newType) => {
    setContentType(newType)
  
    if (newType === "anime") {
      setLatestReleases(latestEpisodes[selectedLanguage] || [])
    } else {
      setLatestReleases(latestScans)
    }
  }
  const handleLanguageChange = (lang) => {
    const normalized = lang.toLowerCase()

    setSelectedLanguage(normalized)

    if (contentType === "anime") {
      setLatestReleases(latestEpisodes[normalized] || [])
    }
  }
  return (
    <div className="MainPage">
      <BackgroundCover coverInfo={coverInfo} whileWatching={false} isAnime={true} />
      <div className={styles.Container}>
        <WatchHistory />
        <LatestReleases
          latestReleases={latestReleases}
          handleContentTypeChange={handleContentTypeChange}
          contentType={contentType}
          availableContentTypes={availableContentTypes}
          availableLanguages={contentType === "anime" ? availableLanguages : ["vf"]}
          selectedLanguage={contentType === "anime" ? selectedLanguage : "vf"}
          handleLanguageChange={handleLanguageChange}
        />
      </div>
    </div>
  )
}
