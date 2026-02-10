import React, { useEffect, useState } from "react"
import styles from "./Home.module.css"
import { useLoader } from "@utils/dispatchers/Page"
import BackgroundCover from "@components/background-cover/BackgroundCover"
import LatestReleases from "./components/LatestReleases"
import WatchHistory from "./components/WatchHistory"

export const Home = () => {
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

        const scans = await window.electron.ipcRenderer.invoke("get-latest-scans")     
        const filteredScans = await filterValidUrls(scans)

        setLatestReleases(filteredEpisodes.length > 0 ? filteredEpisodes : filteredScans)
        setLatestEpisodes(filteredEpisodes)
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
      setLatestReleases(latestEpisodes)
    } else {
      setLatestReleases(latestScans)
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
        />
      </div>
    </div>
  )
}
