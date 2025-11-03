import React, { useEffect, useState } from "react"
import styles from "./Home.module.css"
import { useLoader } from "@utils/dispatchers/Page"
import BackgroundCover from "@components/background-cover/BackgroundCover"
import LatestReleases from "./components/LatestReleases"
import WatchHistory from "./components/WatchHistory"

export const Home = () => {
  const [coverInfo, setCoverInfo] = useState(null)
  const [latestReleases, setLatestReleases] = useState([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const { setLoading } = useLoader()
  const [contentType, setContentType] = useState("anime")
  const [availableContentTypes, setAvailableContentTypes] = useState({
    hasAnime: false,
    hasManga: false, 
  })
  const [latestEpisodes, setLatestEpisodes] = useState([])
  const [latestScans, setLatestScans] = useState([])
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        let animeData = await animeCover.load()

        if (!animeData) {
          const tempData = await window.electron.ipcRenderer.invoke("random-anime")
          const tempInfo = await window.electron.ipcRenderer.invoke("info-anime", tempData.url)
          const animeInfo = {
            ...tempInfo,
            url: tempData.url,
          }
          animeCover.save(animeInfo)
          setCoverInfo(animeInfo)
        } else {
          setCoverInfo(animeData)
        }

        const episodes = await window.electron.ipcRenderer.invoke("get-latest-episode")
        const scans = await window.electron.ipcRenderer.invoke("get-latest-scans")
        setLatestReleases(episodes)
        setLatestEpisodes(episodes)
        setLatestScans(scans)
        setAvailableContentTypes({
          hasAnime: episodes.length > 0,
          hasManga: scans.length > 0,
        })
      } catch (err) {
        console.error("Erreur lors du chargement:", err)
      } finally {
        setLoading(false)
        setDataLoaded(true)
      }
    }
    if (!dataLoaded) {
      fetchData()
    }
  }, [dataLoaded])

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
