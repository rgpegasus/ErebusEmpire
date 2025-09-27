import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImgLoader from '@components/img-loader/ImgLoader';
import styles from './AnimeLibrary.module.css';
export const AnimeLibrary = ({
  storageKey,           
  title,   
  sort = false            
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
    let animes = Object.entries(all).map(([key, data]) => ({ key, ...data }));
    animes.sort((a, b) => a.animeTitle.localeCompare(b.animeTitle));
    if (sort) {
      animes = animes.filter((anime, index, self) => index === 0 || anime.animeTitle !== self[index - 1].animeTitle);
    }
    setAnimeList(animes);
  }; 

const deleteAnime = async (anime) => {
  const all = await animeData.loadAll(storageKey);
  if (!all) return;

  if (sort) {
    const keysToDelete = Object.entries(all)
      .filter(([key, data]) => data.animeTitle === anime.animeTitle)
      .map(([key]) => key);
    for (const key of keysToDelete) {
      await animeData.delete(storageKey, key);
    }
    setAnimeList((prev) => prev.filter((an) => an.animeTitle !== anime.animeTitle));
  } else {
    await animeData.delete(storageKey, anime.key);
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
      <div className={styles.AnimeLibraryContainer}
        ref={containerRef}
        onMouseEnter={() => setIsInside(true)}
        onMouseLeave={() => setIsInside(false)}
      >
        {animeList.length > 0 ? (
          <div className={styles.ResultsContainer}>
            {animeList.map((anime, i) => (
              <div key={anime?.animeTitle || i} className={`${styles.ItemContainer} ${shiftPressed ? styles.ShiftDelete : ''}`}>
                <div className={styles.CoverContainer}>
                    <h3 className={styles.Title}>{anime?.animeTitle}</h3>
                    <div className={styles.Img}>
                        <ImgLoader
                            key={anime.title + anime.cover}
                            anime={anime}
                        />
                    </div>
                  <div onClick={(e) => handleAnimeClick(anime, e)} className={styles.SeeButton}>
                    {shiftPressed ? "Suppr" : "Voir"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.ResultNone}>
           <p className={styles.ResultNoneMessage}>Aucun animé sauvegardé</p>
          </div>
        )}
      </div>
      <div className='Space'></div>
    </div>
  );
};
