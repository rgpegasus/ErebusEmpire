import React, { useEffect, useState } from "react"
import styles from "./Home.module.css"
import { useLoader } from "@utils/dispatchers/Page"
import BackgroundCover from "@components/background-cover/BackgroundCover"
import LatestReleases from "./components/LatestReleases"
import WatchHistory from "./components/WatchHistory"
import { toSlug } from "@utils/functions/toSlug"

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
  function isValidUrl(url) {
    try {
      return fetch(url, { method: "HEAD" }).then((res) => res.ok)
    } catch {
      return false
    }
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
        const filteredEpisodes = []
        for (let episode of episodes) {
          const validUrl = await isValidUrl(episode.url)
          if (validUrl) {
            filteredEpisodes.push(episode)
          }
        }
        const scans = await window.electron.ipcRenderer.invoke("get-latest-scans")
        const filteredScans = []
        for (let scan of scans) {
          const validUrl = await isValidUrl(scan.url)
          if (validUrl) {
            filteredScans.push(scan)
          }
        }
        setLatestReleases(filteredEpisodes)
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
