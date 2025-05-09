import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EpisodeTitle from './scroll-title';

const WatchHistory = () => {
  const [watchedEpisodes, setWatchedEpisodes] = useState([]);
  const [shiftPressed, setShiftPressed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadWatchedEpisodes();

    const handleKeyDown = (e) => {
      if (e.key === 'Shift') setShiftPressed(true);
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') setShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const loadWatchedEpisodes = () => {
    const history = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('lastWatched_')) {
        const raw = localStorage.getItem(key);
        try {
          const parsed = JSON.parse(raw);
          history.push({ ...parsed, key });
        } catch (e) {
          console.error(`Erreur parsing historique pour ${key}`, e);
        }
      }
    }

    history.sort((a, b) => b.timestamp - a.timestamp);
    setWatchedEpisodes(history);
  };

  const handleEpisodeClick = (episode, event) => {
    if (event.shiftKey) {
      localStorage.removeItem(episode.key);
      setWatchedEpisodes((prev) =>
        prev.filter((ep) => ep.key !== episode.key)
      );
      return;
    }

    const [animeId, seasonId] = episode.key.split('_');
    const episodeId = episode.episodeTitle
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    navigate(`/erebus-empire/anime/${animeId}/${seasonId}/${episodeId}`, {
      
      state: {
        url: episode.url,
        host: episode.host,
        episodeTitle: episode.episodeTitle,
        episodes: episode.episodes,
        animeId: episode.animeId,
        seasonId: episode.seasonId,
        animeTitle: episode.animeTitle,
        seasonTitle: episode.seasonTitle,
        animeCover: episode.animeCover,
      },
    });
  };

  return (
    <div>
      {watchedEpisodes.length > 0 && (
        <div>
          <div className="CategorieTitle">Reprendre la lecture :</div>
          <div className="LatestEpisodes">
          <div className="LatestEpisodes-container">
            {watchedEpisodes.map((episode, index) => (
              <div
                key={episode.key || index}
                className={`LatestEpisodes-item ${shiftPressed ? 'shift-delete' : ''}`}
                onClick={(e) => handleEpisodeClick(episode, e)}
              >
                <div className="LatestEpisodes-cover">
                  <h3>{episode.animeTitle}</h3>
                  <img
                    src={episode.animeCover}
                    draggable="false"
                    alt={episode.episodeTitle}
                    className="EpisodeCover"
                  />
                </div>
                <div className="LatestEpisodes-info">
                  <EpisodeTitle title={`${episode.seasonTitle} ${episode.episodeTitle}`} />
                  <div className="Separation"></div>
                  <p>VOSTFR</p>
                </div>
              </div>
            ))}
          </div>
          </div>
          <div className='Space'></div><div className='Space'></div><div className='Space'></div>
        </div>
      )}
    </div>
  );
  
};

export default WatchHistory;
