import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AnimeLibrary.module.css';
import {LoginPageBackground} from "@utils/dispatchers/Pictures"
import BackgroundCover from "@components/background-cover/BackgroundCover"
import ContentsCarousel from '@components/contents-carousel/ContentsCarousel';
export const AnimeLibrary = ({
  storageKey,           
  title,   
  sort = false             
}) => {
  const [animeList, setAnimeList] = useState([]);
  const navigate = useNavigate();
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
  useEffect(() => {
    loadAnimeList(); 
  }, []);
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


  return (
    <div className='MainPage'>
      <BackgroundCover 
        coverInfo = {LoginPageBackground}
        whileWatching = {false}
        isAnime = {false}
      />
      <div className={styles.Container}>
        <ContentsCarousel
          data={animeList}
          title={title}
          onClickEpisode={(anime) => navigate(`/erebus-empire/${anime.animeId}`)}
          getEpisodeCover={(anime) => anime.animeCover}
          getAnimeTitle={(anime) => anime.animeTitle}
          enableShiftDelete={true}
          isSeason={true}
          searchBy={"title"}
          onDeleteEpisode={(anime) => deleteAnime(anime)}
        />
      </div>
    </div>
  );
};
