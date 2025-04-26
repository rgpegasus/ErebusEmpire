import React, { useEffect, useState } from 'react';
import { VideoPlayer } from '../components/video-player/src';

// Fonction de tri "naturel"
const naturalSort = (a, b) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

const DownloadPage = () => {
  const [groupedData, setGroupedData] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [selectedSeasons, setSelectedSeasons] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});

  const handleSeasonChange = (animeTitle, seasonTitle) => {
    setSelectedSeasons(prev => ({ ...prev, [animeTitle]: seasonTitle }));
  };

  useEffect(() => {
    const handler = (_event, data) => {
      const key = `${data.animeTitle}-${data.seasonTitle}-${data.episodeTitle}`;
      setDownloadProgress(prev => ({
        ...prev,
        [key]: {
          percent: data.percent,
          eta: data.eta,
          videoUrl: data.videoUrlo
        }
      }));
    };
  
    window.electron.ipcRenderer.on('download-progress', handler);
    return () => window.electron.ipcRenderer.removeListener('download-progress', handler);
  }, []);
  
  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const { episodes } = await window.electron.ipcRenderer.invoke('get-downloads');

        const animeMap = {};

        episodes.forEach(episode => {
          const { animeTitle, seasonTitle, state} = episode.metadata;
          const downloadedAt = new Date(episode.metadata.downloadedAt);
          if (!animeMap[animeTitle]) {
            animeMap[animeTitle] = {
              cover: episode.cover,
              seasons: {},
              latestDownload: downloadedAt,
            };
          } else {
            if (downloadedAt > animeMap[animeTitle].latestDownload) {
              animeMap[animeTitle].latestDownload = downloadedAt;
            }
          }

          if (!animeMap[animeTitle].seasons[seasonTitle]) {
            animeMap[animeTitle].seasons[seasonTitle] = [];
          }

          animeMap[animeTitle].seasons[seasonTitle].push(episode);}
        );

        const sortedAnimes = Object.entries(animeMap)
          .map(([title, data]) => ({ title, ...data }))
          .sort((a, b) => b.latestDownload - a.latestDownload); // Plus récents en haut

        setGroupedData(sortedAnimes);
      } catch (error) {
        console.error('Erreur lors de la récupération des fichiers:', error);
      }
    };

    fetchDownloads();
  }, []);

  const handleVideoClick = (episode) => {
    const filePath = `file://${episode.path.replace(/\\/g, '/')}`;
    const { animeTitle, seasonTitle, episodeTitle, animeCover } = episode.metadata;
    setSelectedEpisode({ animeTitle, seasonTitle, episodeTitle, animeCover, filePath });
  };
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);


  const playVideoClick = async () => {
    const { animeTitle, seasonTitle, episodeTitle, animeCover } = episode.metadata;
  
    // Récupérer les informations de progression du téléchargement à partir de l'état `downloadProgress`
    const progressData = downloadProgress[`${animeTitle}-${seasonTitle}-${episodeTitle}`];
  
    if (progressData) {
      const { videoUrl, percent, eta } = progressData;
      
      console.log(`Progression pour ${animeTitle} - ${episodeTitle}: ${percent}%`);
      console.log(`Temps restant estimé: ${eta}`);
  
      try {
        // Envoie la commande pour démarrer ou mettre en pause le téléchargement avec les informations
        await window.electron.ipcRenderer.invoke('download-video', videoUrl, {
          episodeTitle,
          seasonTitle,
          animeTitle,
          animeCover
        });
      } catch (error) {
        console.error("Erreur lors du téléchargement de la vidéo :", error);
      }
    } else {
      console.error("Aucune information de progression disponible pour cet épisode.");
    }
  };
  


  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Ajoute l'écouteur
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const episodeLists = document.querySelectorAll('.DownloadAnime-episode-list');
    const titles = document.querySelectorAll('.DownloadAnime-info h2');
  
    if (!episodeLists.length || !titles.length) return;
  
    episodeLists.forEach((episodeList, index) => {
      const title = titles[index]; // Récupère le titre correspondant à chaque liste d'épisodes
      const hasScroll = episodeList.scrollWidth > episodeList.clientWidth;
  
      title.classList.remove('padding-scroll-on', 'padding-scroll-off');
      title.classList.add(hasScroll ? 'padding-scroll-on' : 'padding-scroll-off');
    });
  }, [groupedData, windowWidth, selectedSeasons]); 
  
  return (
    <div className="MainPage">
      <div className='Space'></div>
  
      {/* Téléchargements en cours */}
      {groupedData.some(anime =>
        Object.values(anime.seasons).some(season =>
          season.some(episode => episode.metadata.state === 'downloading')
        )
      ) && (
        <>
          <div className="CategorieTitle">Téléchargement en cours :</div>
          
          <div>
            {groupedData.map(anime =>
              Object.entries(anime.seasons).map(([seasonTitle, episodes]) =>
                episodes
                  .filter(ep => ep.metadata.state === "downloading")
                  .sort((a, b) => naturalSort(a.metadata.episodeTitle, b.metadata.episodeTitle))
                  .map((episode, idx) => {
                    const { episodeTitle } = episode.metadata;
                    const progressKey = `${anime.title}-${seasonTitle}-${episodeTitle}`;
                    const progress = downloadProgress[progressKey];
                    const seasonEntries = Object.entries(anime.seasons);
                    return (
                      <div key={anime.title} className="DownloadAnime-box">
                        <div className="DownloadAnime-item">
                          <img src={`file://${anime.cover.replace(/\\/g, '/')}`} alt={`${anime.title} cover`} />
                          <div className='DownloadAnime-info'>
                            <h2>{anime.title}</h2>
                            <h3 className='DownloadAnime-season'>{seasonEntries[0][0]}</h3>
                            {progress && (
                              <div className="DownloadProgress">
                                <div className="ProgressBar" style={{ width: `${progress.percent}%` }}></div>
                                <div className="ProgressText">
                                  {progress.percent.toFixed(1)}% - Temps restant : {progress.eta || '...'}
                                </div>
                              </div>
                            )}
                            {/* <button onClick={playVideoClick}>Play</button> */}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )
            )}
          </div>
        </>
      )}
  
      {/* Episodes téléchargés */}
      <div className="CategorieTitle">Episodes téléchargés :</div>
      {groupedData.map(anime => {
        const seasonEntries = Object.entries(anime.seasons).sort(([a], [b]) => naturalSort(a, b));
        const hasMultipleSeasons = seasonEntries.length > 1;
        const selectedSeason = selectedSeasons[anime.title] || seasonEntries[0][0];
        const episodes = anime.seasons[selectedSeason] || [];
        const downloadedEpisodes = episodes.filter(ep => ep.metadata.state === "downloaded");
  
        if (downloadedEpisodes.length === 0) return null;
  
        return (
          <div key={anime.title} className="DownloadAnime-box">
            <div className="DownloadAnime-item">
              <img src={`file://${anime.cover.replace(/\\/g, '/')}`} alt={`${anime.title} cover`} />
              <div className='DownloadAnime-info'>
                <h2>{anime.title}</h2>
                {hasMultipleSeasons ? (
                  <select
                    value={selectedSeason}
                    onChange={(e) => handleSeasonChange(anime.title, e.target.value)}
                    className='DownloadAnime-select'
                  >
                    {seasonEntries.map(([seasonTitle]) => (
                      <option key={seasonTitle} value={seasonTitle}>
                        {seasonTitle}
                      </option>
                    ))}
                  </select>
                ) : (
                  <h3 className='DownloadAnime-season'>{seasonEntries[0][0]}</h3>
                )}
  
                <div className="DownloadAnime-episode-list">
                  {downloadedEpisodes
                    .sort((a, b) => naturalSort(a.metadata.episodeTitle, b.metadata.episodeTitle))
                    .map((episode, index) => (
                      <div
                        key={index}
                        onClick={() => handleVideoClick(episode)}
                        className="DownloadAnime-episode-item"
                      >
                        <h4>{episode.metadata.episodeTitle}</h4>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
  
      {/* Lecteur vidéo */}
      {selectedEpisode && (
        <div className="video-player mt-6">
          <VideoPlayer
            src={selectedEpisode.filePath}
            overlayEnabled={true}
            title={selectedEpisode.animeTitle}
            subTitle={`${selectedEpisode.seasonTitle} - ${selectedEpisode.episodeTitle}`}
            titleMedia={`${selectedEpisode.animeTitle} - ${selectedEpisode.seasonTitle} : ${selectedEpisode.episodeTitle}`}
            autoControllCloseEnabled={true}
            fullPlayer={false}
            playerLanguage="fr"
            autoPlay={true}
            playbackRateEnable={false}
            primaryColor="#996e35"
          />
        </div>
      )}
    </div>
  );
  
};

export default DownloadPage;