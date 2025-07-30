import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Watchlist = () => {
  const [animeWatchlist, setAnimeWatchlist] = useState([]);
  const [shiftPressed, setShiftPressed] = useState(false);
  const containerRef = useRef(null); 
  const [isInside, setIsInside] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnimeWatchlist(); 
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
  
  const loadAnimeWatchlist = async () => {
    const all = await animeData.loadAll("animeWatchlist");  
    if (!all) return;

    const animes = Object.entries(all).map(([key, data]) => ({ key, ...data }));
    animes.sort((a, b) => a.animeTitle.localeCompare(b.animeTitle));
    setAnimeWatchlist(animes);
  };

  const deleteAnimeWatchlist = async (anime) => {
    await animeData.delete("animeWatchlist", anime.key);
    const all = await animeData.loadAll("animeWatchlist");
    if (Object.keys(all).length === 0) {
      setAnimeWatchlist([]);
    } else {
      setAnimeWatchlist((prev) => prev.filter((an) => an.key !== anime.key));
    }
  };

const handleAnimeClick = async (anime, event) => {
  if (event.shiftKey) {
    deleteAnimeWatchlist(anime);
    return;
  }
  navigate(`/erebus-empire/anime/${anime.animeId}`, {
  });
  setLoading(false);
};

  return (
    <div className='MainPage'>
      <div className='Space'></div> 
      <div className="CategorieTitle">Animés à Regarder :</div>
      <div className='CatalogAll'
        ref={containerRef}
        onMouseEnter={() => setIsInside(true)}
        onMouseLeave={() => setIsInside(false)}
      >
        {animeWatchlist.length > 0 ? (
          <div className="CatalogEpisodes">
            {animeWatchlist.map((anime, i) => (
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
            <p>Aucun animé en attente</p>
          </div>
        )}
      </div>
      <div className='Space'></div>
    </div>
  );
};

