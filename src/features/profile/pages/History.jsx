import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const History = () => {
  const [watchedAnimes, setWatchedAnimes] = useState([]);
  const [shiftPressed, setShiftPressed] = useState(false);
  const containerRef = useRef(null);
  const [isInside, setIsInside] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadWatchedAnimes(); 
    const handleKeyDown = (e) => {
      if (e.key === 'Shift' && isInside) setShiftPressed(true);
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
  }, [isInside]);

const loadWatchedAnimes = async () => {
  const all = await animeData.loadAll("animeWatchHistory");
  if (!all) return;

  const episodes = Object.entries(all).map(([key, data]) => ({ key, ...data }));

  episodes.sort((a, b) => a.animeTitle.localeCompare(b.animeTitle)); 
  const uniqueByTitle = new Map();
  for (const episode of episodes) {
    if (!uniqueByTitle.has(episode.animeTitle)) {
      uniqueByTitle.set(episode.animeTitle, episode);
    }
  }

  setWatchedAnimes(Array.from(uniqueByTitle.values()));
};

const deleteEpisode = async (episode) => {
  const all = await animeData.loadAll("animeWatchHistory");
  if (!all) return;
  const entriesToDelete = Object.entries(all).filter(([_, data]) => data.animeTitle === episode.animeTitle);
  for (const [storageKey] of entriesToDelete) {
    await animeData.delete("animeWatchHistory", storageKey);
  }
  await loadWatchedAnimes();
};

const handleAnimeClick = async (episode, event) => {
  if (event.shiftKey) {
    deleteEpisode(episode);
    return;
  }
  navigate(`/erebus-empire/anime/${episode.animeId}`, {
  });
};

  return (
    <div className='MainPage'>
      <div className='Space'></div> 
      <div className="CategorieTitle">Animés en Cours :</div>
      <div className='CatalogAll'
        ref={containerRef}
        onMouseEnter={() => setIsInside(true)}
        onMouseLeave={() => setIsInside(false)}
      >
        {watchedAnimes.length > 0 ? (
          <div className="CatalogEpisodes">
            {watchedAnimes.map((anime, i) => (
              <div key={anime?.animeTitle || i} className={`CatalogEpisodes-item ${shiftPressed ? 'shift-delete' : ''}`}>
                <div className="CatalogEpisodes-cover">
                  <h3>{anime?.animeTitle}</h3>
                  <img src={anime?.animeCover} alt={anime?.animeTitle} draggable={false} className="EpisodeCover" />
                  <div onClick={(e) => handleAnimeClick(anime, e)} className='CatalogEpisodes-button'>{shiftPressed?"Suppr":"Voir"}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="AFK">
            <p>Aucun animé disponible</p>
          </div>
        )}
      </div>
      <div className='Space'></div>
    </div>
  );
};

