import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoader } from '@utils/dispatchers/Page';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow'; 
import ContentsCarousel from '@components/contents-carousel/ContentsCarousel';

const WatchHistory = () => {
  const [watchedEpisodes, setWatchedEpisodes] = useState([]);
  const navigate = useNavigate();
  const { setLoading } = useLoader();

  useEffect(() => {
    loadWatchedEpisodes();
  }, []);


  const loadWatchedEpisodes = async () => {
    const all = await animeData.loadAll("animeWatchHistory");  
    if (!all) return;

    const episodes = Object.entries(all).map(([key, data]) => ({ key, ...data }));
    episodes.sort((a, b) => b.timestamp - a.timestamp);
    setWatchedEpisodes(episodes);
  };

  const deleteEpisode = async (episode) => {
    await animeData.delete("animeWatchHistory", episode.key);
    const all = await animeData.loadAll("animeWatchHistory");
    if (Object.keys(all).length === 0) {
      setWatchedEpisodes([]);
    } else {
      setWatchedEpisodes((prev) => prev.filter((ep) => ep.key !== episode.key));
    }
  };

  const fetchEpisodes = async (episode) => {
  const result = {};

  try {
    const baseUrl = episode.seasonUrl.split("/").slice(0, 6).join("/");

    const languageResults = await Promise.all(
      episode.availableLanguages.map(async (lang) => {
        const langUrl = `${baseUrl}/${lang.toLowerCase()}`;
        const data = await window.electron.ipcRenderer.invoke('get-episodes', langUrl, true);
        if (data === null) { 
          return null;
        }
        return { lang, data };
      })
    );

    languageResults.forEach(({ lang, data }) => {
      result[lang.toLowerCase()] = data;
    });
    

    return result;
  } catch (error) {
    console.error("Erreur lors de la récupération des épisodes :", error);
    return null;
  }
};


const handleEpisodeClick = async (episode, event) => {
  setLoading(true);
  const episodes = await fetchEpisodes(episode); 
  if (episodes === null) {
    setLoading(false)
    return;
  }
  const episodeId = episode.episodeTitle
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  navigate(`/erebus-empire/anime/${episode.animeId}/${episode.seasonId}/${episodeId}`, {
    state: {
      episodeTitle: episode.episodeTitle,
      episodes,  
      animeId: episode.animeId,
      seasonId: episode.seasonId,
      animeTitle: episode.animeTitle,
      seasonTitle: episode.seasonTitle,
      animeCover: episode.animeCover,
      seasonUrl: episode.seasonUrl,
      availableLanguages:episode.availableLanguages,
      selectedLanguage:episode.selectedLanguage

    },
  });
  setLoading(false);
};
   return (
    <ContentsCarousel
      title="Reprendre la lecture :"
      data={watchedEpisodes}
      onClickEpisode={handleEpisodeClick}
      onDeleteEpisode={(ep) => deleteEpisode(ep)}
      getEpisodeCover={(ep) => ep.animeCover}
      getEpisodeTitle={(ep) => ep.animeTitle}
      getEpisodeSubTitle={(ep) => `${ep.seasonTitle} ${ep.episodeTitle}`}
      availableLanguageKey="selectedLanguage"
      enableShiftDelete={true}
    />
  );
};

export default WatchHistory;
