import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImgLoader from '@components/img-loader/ImgLoader';
import styles from './AnimeLibrary.module.css';
export const AnimeLibrary = ({
  storageKey,           
  title,               
}) => {
  const [animeList, setAnimeList] = useState([]);
  const [shiftPressed, setShiftPressed] = useState(false);
  const containerRef = useRef(null); 
  const [isInside, setIsInside] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnimeList(); 

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

  const loadAnimeList = async () => {
    const all = await animeData.loadAll(storageKey);  
    if (!all) return;
    const animes = Object.entries(all).map(([key, data]) => ({ key, ...data }));
    animes.sort((a, b) => a.animeTitle.localeCompare(b.animeTitle));
    setAnimeList(animes);
  };

  const deleteAnime = async (anime) => {
    await animeData.delete(storageKey, anime.key);
    const all = await animeData.loadAll(storageKey);
    if (!all || Object.keys(all).length === 0) {
      setAnimeList([]);
    } else {
      setAnimeList((prev) => prev.filter((an) => an.key !== anime.key));
    }
  };

  const handleAnimeClick = async (anime, event) => {
    if (event.shiftKey) {
      deleteAnime(anime);
      return;
    }
    navigate(`/erebus-empire/anime/${anime.animeId}`);
  };

  return (
    <div className='MainPage'>
      <div className='Space'></div> 
      <div className="CategorieTitle">{title}</div>
      <div className='CatalogAll'
        ref={containerRef}
        onMouseEnter={() => setIsInside(true)}
        onMouseLeave={() => setIsInside(false)}
      >
        {animeList.length > 0 ? (
          <div className="CatalogEpisodes">
            {animeList.map((anime, i) => (
              <div key={anime?.animeTitle || i} className={`CatalogEpisodes-item ${shiftPressed ? 'shift-delete' : ''}`}>
                <div className="CatalogEpisodes-cover">
                    <h3>{anime?.animeTitle}</h3>
                    <div className={styles.Cover}>
                        <ImgLoader
                            key={anime.title + anime.cover}
                            anime={anime}
                        />
                    </div>
                  {/* <img src={anime?.animeCover} alt={anime?.animeTitle} draggable={false} className="EpisodeCover" /> */}
                  <div onClick={(e) => handleAnimeClick(anime, e)} className='CatalogEpisodes-button'>
                    {shiftPressed ? "Suppr" : "Voir"}
                  </div>
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
