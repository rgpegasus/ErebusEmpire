import React, { useEffect, useState, useContext } from "react"
import styles from "./Home.module.css"
import { useLoader } from "@context/loader-context/LoaderContext"
import BackgroundCover from "@components/background-cover/BackgroundCover"
import LatestReleases from "./components/LatestReleases"
import WatchHistory from "./components/WatchHistory"
import { UserContext } from '@context/user-context/UserContext';

export const Home = () => {
  const { favoriteLanguage } = useContext(UserContext);
  const [coverInfo, setCoverInfo] = useState(null)
  const [latestReleases, setLatestReleases] = useState([])
  const { withLoading } = useLoader()
  const [contentType, setContentType] = useState("anime")
  const [availableContentTypes, setAvailableContentTypes] = useState({
    hasAnime: false,
    hasManga: false,
  })
  const [latestEpisodes, setLatestEpisodes] = useState([])
  const [latestScans, setLatestScans] = useState([])
  const [availableLanguages, setAvailableLanguages] = useState([])
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const groupByLanguage = (episodes) => {
    const byLang = {}
    for (const ep of episodes) (byLang[ep.language?.toLowerCase() || "vf"] ??= []).push(ep)
    const langs = Object.keys(byLang).sort((a, b) =>
      a === favoriteLanguage ? -1 : b === favoriteLanguage ? 1 : byLang[b].length - byLang[a].length)
    return { byLang, langs }
  }

  useEffect(() => {
    let cancelled = false
    const loadCover = async () => {
      const random = await window.api.invoke("random-anime")
      if (!random?.url) return
      const info = await window.api.invoke("info-anime", random.url)
      if (!cancelled && info?.title) setCoverInfo({ ...info, url: random.url })
    }
    const loadReleases = async () => {
      const [episodes, scans] = await Promise.all([
        window.api.invoke("get-latest-episode"),
        window.api.invoke("get-latest-scans"),
      ])
      if (cancelled) return
      const { byLang, langs } = groupByLanguage(episodes)
      setAvailableLanguages(langs)
      setSelectedLanguage(langs[0] ?? "")
      setLatestEpisodes(byLang)
      setLatestScans(scans)
      setLatestReleases(langs.length ? byLang[langs[0]] : scans)
      setAvailableContentTypes({ hasAnime: episodes.length > 0, hasManga: scans.length > 0 })
    }
    withLoading(() => loadReleases()).catch((e) => console.error("[home] sorties :", e))
    withLoading(() => loadCover().catch((e) => console.error("[home] cover :", e)))

    return () => { cancelled = true }
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
