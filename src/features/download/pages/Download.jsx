import React, { useEffect, useState } from 'react';
import { VideoPlayer } from '@components/video-player/src';

const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

export const Download = () => {
  const [groupedData, setGroupedData] = useState([]);
  const [downloadingData, setDownloadingData] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [selectedSeasons, setSelectedSeasons] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [shiftPressed, setShiftPressed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleKeyDown = (e) => e.key === 'Shift' && setShiftPressed(true);
    const handleKeyUp = (e) => e.key === 'Shift' && setShiftPressed(false);
    const handleResize = () => setWindowWidth(window.innerWidth);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const { episodes } = await window.electron.ipcRenderer.invoke('get-downloads');
        const downloadingEpisodes = [];
        const animeMap = {};

        episodes.forEach(({ metadata, path, cover }) => {
          const { animeTitle, seasonTitle, downloadedAt, state } = metadata;
        
          if (state === "downloading") {
            downloadingEpisodes.push({ metadata, path, cover });
            return;
          }
        
          if (!animeMap[animeTitle]) {
            animeMap[animeTitle] = { cover, seasons: {}, latestDownload: new Date(downloadedAt) };
          }
          if (new Date(downloadedAt) > animeMap[animeTitle].latestDownload) {
            animeMap[animeTitle].latestDownload = new Date(downloadedAt);
          }
          animeMap[animeTitle].seasons[seasonTitle] = animeMap[animeTitle].seasons[seasonTitle] || [];
          animeMap[animeTitle].seasons[seasonTitle].push({ metadata, path });
        });

        const sortedAnimes = Object.entries(animeMap)
          .map(([title, data]) => ({ title, ...data }))
          .sort((a, b) => b.latestDownload - a.latestDownload);

        setGroupedData(sortedAnimes);
        setDownloadingData(downloadingEpisodes);
      } catch (error) {
        console.error('Erreur lors de la récupération des fichiers:', error);
      }
    };

    fetchDownloads();
  }, []);

  useEffect(() => {
    const handler = (_event, data) => {
      const key = `${data.animeTitle}-${data.seasonTitle}-${data.episodeTitle}`;
      setDownloadProgress(prev => ({
        ...prev,
        [key]: {
          percent: data.percent,
          eta: data.eta,
          videoUrl: data.videoUrl
        }
      }));
    };

    window.electron.ipcRenderer.on('download-progress', handler);
    return () => window.electron.ipcRenderer.removeListener('download-progress', handler);
  }, []);

  useEffect(() => {
    const episodeLists = document.querySelectorAll('.DownloadAnime-episode-list');
    const titles = document.querySelectorAll('.DownloadAnime-info h2');

    episodeLists.forEach((list, idx) => {
      const hasScroll = list.scrollWidth > list.clientWidth;
      titles[idx]?.classList.toggle('padding-scroll-on', hasScroll);
      titles[idx]?.classList.toggle('padding-scroll-off', !hasScroll);
    });
  }, [groupedData, windowWidth, selectedSeasons]);

  const handleSeasonChange = (animeTitle, seasonTitle) => {
    setSelectedSeasons(prev => ({ ...prev, [animeTitle]: seasonTitle }));
  };

  const handleEpisodeClick = async (episode, event) => {
    if (event.shiftKey) {
      try {
        await window.electron.ipcRenderer.invoke('delete-episode', episode.path);
        setGroupedData(prevData =>
          prevData
            .map(anime => {
              const updatedSeasons = {};
              for (const [seasonTitle, episodes] of Object.entries(anime.seasons)) {
                const remaining = episodes.filter(ep => ep.path !== episode.path);
                if (remaining.length) updatedSeasons[seasonTitle] = remaining;
              }
              return Object.keys(updatedSeasons).length ? { ...anime, seasons: updatedSeasons } : null;
            })
            .filter(Boolean)
        );
      } catch (error) {
        console.error('Erreur lors de la suppression du fichier:', error);
      }
    } else {
      const { animeTitle, seasonTitle, episodeTitle, animeCover } = episode.metadata;
      const filePath = encodeURI(`file://${episode.path.replace(/\\/g, '/')}`);
      console.log(filePath)
      setSelectedEpisode({ animeTitle, seasonTitle, episodeTitle, animeCover, filePath });
    }
  };

  return (
    <div className="MainPage">
      <div className="Space" />

      {/* Téléchargements en cours */}
      {downloadingData.length > 0 && (
        <>
          <div className="CategorieTitle">Téléchargement en cours :</div>
          <div>
            {downloadingData
              .sort((a, b) => naturalSort(a.metadata.episodeTitle, b.metadata.episodeTitle))
              .map(episode => {
                const { animeTitle, seasonTitle, episodeTitle } = episode.metadata;
                const progressKey = `${animeTitle}-${seasonTitle}-${episodeTitle}`;
                const progress = downloadProgress[progressKey];

                return (
                  <div key={episode.path} className="DownloadAnime-box">
                    <div className="DownloadAnime-item">
                      <div  className="DownloadAnime-item-img"><img src={`file://${episode.cover.replace(/\\/g, '/')}`} alt={`${animeTitle} cover`} /></div>
                      <div className="DownloadAnime-info">
                        <h2>{animeTitle}</h2>
                        <h3 className="DownloadAnime-season">{seasonTitle}</h3>
                        {progress && (
                          <div className="DownloadProgress">
                            <div className="ProgressBar" style={{ width: `${progress.percent}%` }} />
                            <div className="ProgressText">
                              {progress.percent.toFixed(1)}% - Temps restant : {progress.eta || '...' }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}


      {/* Episodes téléchargés */}
      <div className="CategorieTitle">Episodes téléchargés :</div>
      {groupedData.map(anime => {
        const seasonEntries = Object.entries(anime.seasons).sort(([a], [b]) => naturalSort(a, b));
        const selectedSeason = selectedSeasons[anime.title] || seasonEntries[0][0];
        const episodes = anime.seasons[selectedSeason]?.filter(ep => ep.metadata.state === "downloaded") || [];

        const hasDownloadedEpisodes = Object.values(anime.seasons)
          .flat()
          .some(ep => ep.metadata.state === "downloaded");
              
        if (!hasDownloadedEpisodes) return null;
        return (
          <div key={anime.title} className="DownloadAnime-box">
            <div className="DownloadAnime-item">
              <div  className="DownloadAnime-item-img"><img src={`file://${anime.cover.replace(/\\/g, '/')}`} alt={`${anime.title} cover`} /></div>
              <div className="DownloadAnime-info">
                <h2>{anime.title}</h2>
                {seasonEntries.length > 1 ? (
                  <select
                    value={selectedSeason}
                    onChange={e => handleSeasonChange(anime.title, e.target.value)}
                    className="DownloadAnime-select"
                  >
                    {seasonEntries.map(([seasonTitle]) => (
                      <option key={seasonTitle} value={seasonTitle}>
                        {seasonTitle}
                      </option>
                    ))}
                  </select>
                ) : (
                  <h3 className="DownloadAnime-season">{selectedSeason}</h3>
                )}
                <div className="DownloadAnime-episode-list">
                  {episodes
                    .sort((a, b) => naturalSort(a.metadata.episodeTitle, b.metadata.episodeTitle))
                    .map(episode => (
                      <div
                        key={episode.path}
                        onClick={e => handleEpisodeClick(episode, e)}
                        className={`DownloadAnime-episode-item ${shiftPressed ? 'shift-delete' : ''}`}
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
            overlayEnabled
            title={selectedEpisode.animeTitle}
            subTitle={`${selectedEpisode.seasonTitle} - ${selectedEpisode.episodeTitle}`}
            titleMedia={`${selectedEpisode.animeTitle} - ${selectedEpisode.seasonTitle} : ${selectedEpisode.episodeTitle}`}
            autoControllCloseEnabled
            fullPlayer={false}
            playerLanguage="fr"
            autoPlay
            playbackRateEnable={false}
            primaryColor="#996e35"
          />
        </div>
      )}
    </div>
  );
};

