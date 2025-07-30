import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const OnHold = () => {
  const [animeOnHold, setAnimeOnHold] = useState([]);
  const [shiftPressed, setShiftPressed] = useState(false);
  const containerRef = useRef(null); 
  const [isInside, setIsInside] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnimeOnHold(); 
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

  const loadAnimeOnHold = async () => {
    const all = await animeData.loadAll("animeOnHold");  
    if (!all) return;

    const animes = Object.entries(all).map(([key, data]) => ({ key, ...data }));
    animes.sort((a, b) => a.animeTitle.localeCompare(b.animeTitle));
    setAnimeOnHold(animes);
  };

  const deleteAnimeOnHold = async (anime) => {
    await animeData.delete("animeOnHold", anime.key);
    const all = await animeData.loadAll("animeOnHold");
    if (Object.keys(all).length === 0) {
      setAnimeOnHold([]);
    } else {
      setAnimeOnHold((prev) => prev.filter((an) => an.key !== anime.key));
    }
  };

const handleAnimeClick = async (anime, event) => {
  if (event.shiftKey) {
    deleteAnimeOnHold(anime);
    return;
  }
  navigate(`/erebus-empire/anime/${anime.animeId}`, {
  });
  setLoading(false);
};

  return (
    <div className='MainPage'>
      <div className='Space'></div> 
      <div className="CategorieTitle">Animés en Attente :</div>
      <div className='CatalogAll'
        ref={containerRef}
        onMouseEnter={() => setIsInside(true)}
        onMouseLeave={() => setIsInside(false)}
      >
        {animeOnHold.length > 0 ? (
          <div className="CatalogEpisodes">
            {animeOnHold.map((anime, i) => (
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

