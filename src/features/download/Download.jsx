import React, { useEffect, useState } from 'react'
import { ErebusPlayer } from '@components/video-player/VideoPlayer'
import { useNavigate } from 'react-router-dom'
import { LoginPageBackground } from '@utils/dispatchers/Pictures'
import BackgroundCover from '@components/background-cover/BackgroundCover'
import styles from './Download.module.css'
import { useLoader } from '@utils/dispatchers/Page'
import { PauseCircleIcon } from 'lucide-react'
import ContentsCarousel from "@components/contents-carousel/ContentsCarousel"
const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

export const Download = () => {
  const [groupedData, setGroupedData] = useState([])
  const [downloadingData, setDownloadingData] = useState([])
  const [selectedEpisode, setSelectedEpisode] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState({})
  const { setLoading } = useLoader()
  const navigate = useNavigate()


  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        setLoading(true)
        const { episodes } = await window.electron.ipcRenderer.invoke('get-downloads')
        const downloadingEpisodes = []
        const animeMap = {}

        episodes.forEach(({ metadata, path, cover }) => {
          const { animeTitle, seasonTitle, downloadedAt, state } = metadata

          if (state === 'downloading') {
            downloadingEpisodes.push({ metadata, path, cover })
            return
          }

          if (!animeMap[animeTitle]) {
            animeMap[animeTitle] = { cover, seasons: {}, latestDownload: new Date(downloadedAt) }
          }
          if (new Date(downloadedAt) > animeMap[animeTitle].latestDownload) {
            animeMap[animeTitle].latestDownload = new Date(downloadedAt)
          }
          animeMap[animeTitle].seasons[seasonTitle] =
            animeMap[animeTitle].seasons[seasonTitle] || []
          animeMap[animeTitle].seasons[seasonTitle].push({ metadata, path })
        })

        const sortedAnimes = Object.entries(animeMap)
          .map(([title, data]) => ({ title, ...data }))
          .sort((a, b) => b.latestDownload - a.latestDownload)

        setGroupedData(sortedAnimes)
        setDownloadingData(downloadingEpisodes)
      } catch (error) {
        console.error('Erreur lors de la récupération des fichiers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDownloads()
  }, [])

  useEffect(() => {
    const handler = (_event, data) => {
      const key = `${data.animeTitle}-${data.seasonTitle}-${data.episodeTitle}`
      setDownloadProgress((prev) => ({
        ...prev,
        [key]: {
          percent: data.percent,
          eta: data.eta,
          videoUrl: data.videoUrl
        }
      }))
    }

    window.electron.ipcRenderer.on('download-progress', handler)
    return () => window.electron.ipcRenderer.removeListener('download-progress', handler)
  }, [])
  const flattenedData = groupedData.flatMap((anime) =>
    Object.entries(anime.seasons).flatMap(([seasonTitle, episodes]) =>
      episodes.map((ep) => ({
        animeTitle: anime.title,
        seasonTitle,
        episodeTitle: ep.metadata.episodeTitle,
        cover: anime.cover,
        path: ep.path,
        state: ep.metadata.state,
      })),
    ),
  )
  const handleEpisodeClick = async (episode) => {  
    setLoading(true)
    const { animeTitle, seasonTitle, episodeTitle, animeCover } = episode
    const normalizedPath = episode.path.replace(/\\/g, '/')
    const filePath = `file:///${encodeURI(normalizedPath)}`
    setSelectedEpisode({ animeTitle, seasonTitle, episodeTitle, animeCover, filePath })
    setLoading(false)
  }
  const deleteEpisode = async (episode) => {
    try {
      await window.electron.ipcRenderer.invoke("delete-episode", episode.path)
      setGroupedData((prevData) =>
        prevData
          .map((anime) => {
            const updatedSeasons = {}
            for (const [seasonTitle, episodes] of Object.entries(anime.seasons)) {
              const remaining = episodes.filter((ep) => ep.path !== episode.path)
              if (remaining.length) updatedSeasons[seasonTitle] = remaining
            }
            return Object.keys(updatedSeasons).length ? { ...anime, seasons: updatedSeasons } : null
          })
          .filter(Boolean),
      )
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier:", error)
    }
  }
  const onClose = () => {
    setSelectedEpisode(null)
  }
  return (
    <div className="MainPage">
      <BackgroundCover coverInfo={LoginPageBackground} whileWatching={false} isAnime={false} />

      <div className={styles.Container}>
        {downloadingData.length > 0 && (
          <>
            <div className={styles.Title}>Téléchargements en cours</div>
            <div>
              {downloadingData
                .sort((a, b) => naturalSort(a.metadata.episodeTitle, b.metadata.episodeTitle))
                .map((episode) => {
                  const { animeTitle, seasonTitle, episodeTitle } = episode.metadata
                  const progressKey = `${animeTitle}-${seasonTitle}-${episodeTitle}`
                  const progress = downloadProgress[progressKey]

                  return (
                    <div key={episode.path} className={styles.ContainerProgress}>
                      <div className={styles.ContainerProgressCover}>
                        <img
                          className={styles.ProgressCover}
                          src={`file://${episode.cover.replace(/\\/g, "/")}`}
                          alt={`${animeTitle} cover`}
                        />
                      </div>
                      <div className={styles.ProgressWrapper}>
                        <div>
                          <h2 className={styles.AnimeTitleProgress}>{animeTitle}</h2>
                          <h3
                            className={styles.EpisodeTitleProgress}
                          >{`${seasonTitle} - ${episodeTitle}`}</h3>
                        </div>

                        {progress && (
                          <div className={styles.DownloadProgress}>
                            <PauseCircleIcon className={styles.PauseIcon} />
                            <div className={styles.ProgressBar}>
                              <div
                                className={styles.CurrentProgressBar}
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>
                            <div className={styles.SecondLeft}>{progress.eta || "0:00"}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </>
        )}

        {/* Episodes téléchargés */}
        <ContentsCarousel
          title="Episodes téléchargés"
          data={flattenedData}
          onClickEpisode={(episode) => handleEpisodeClick(episode)}
          onDeleteEpisode={(ep) => deleteEpisode(ep)}
          getEpisodeCover={(anime) => `file://${anime.cover.replace(/\\/g, "/")}`}
          getAnimeTitle={(ep) => ep.animeTitle}
          getAnimeUrl={(ep) => ep.seasonUrl}
          getEpisodeSubTitle={(ep) => `${ep.seasonTitle} - ${ep.episodeTitle}`}
          getUrlErebus={(ep) => `/erebus-empire/${ep.animeId}/${ep.seasonId}/${ep.episodeId}`}
          availableLanguageKey="selectedLanguage"
          enableShiftDelete={true}
          display={false}
        />
        

        {/* Lecteur vidéo */}
        {selectedEpisode && (
          <div>
            <div className="video-player mt-6">
              <ErebusPlayer
                key={`${selectedEpisode.animeTitle}-${selectedEpisode.seasonTitle}-${selectedEpisode.episodeTitle}`}
                src={selectedEpisode.filePath}
                overlayEnabled={true}
                title={selectedEpisode.animeTitle}
                subTitle={`${selectedEpisode.seasonTitle} - ${selectedEpisode.episodeTitle}`}
                titleMedia={`${selectedEpisode.animeTitle} - ${selectedEpisode.seasonTitle} : ${selectedEpisode.episodeTitle}`}
                autoControllCloseEnabled={true}
                fullPlayer={false}
                autoPlay={true}
                onCrossClick={onClose}
                settingsEnabled={false}
              />
            </div>
            <div className="Space"></div>
          </div>
        )}
      </div>
    </div>
  )
}
