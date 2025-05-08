import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../components/loader';

const SeasonsPage = () => {
  const { animeId, seasonId } = useParams();
  const navigate = useNavigate();
  const animeUrl = `https://anime-sama.fr/catalogue/${animeId}`;
  const [animeInfo, setAnimeInfo] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Récupérer les informations de l'anime
  useEffect(() => {
    const fetchAnimeInfo = async () => {
      try {
        setLoading(true);
        const info = await window.electron.ipcRenderer.invoke('info-anime', animeUrl);
        setAnimeInfo(info);
      } catch (error) {
        console.error("Erreur lors de la récupération des informations de l'anime :", error);
      } 
    };
    fetchAnimeInfo();
  }, [animeUrl]);

  // Récupérer les saisons et réinitialiser les épisodes à chaque changement d'anime
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        setLoading(true);
        const fetchedSeasons = await window.electron.ipcRenderer.invoke('get-seasons', animeUrl);
        setSeasons(fetchedSeasons);
        if (fetchedSeasons.length > 0) {
          const seasonId = fetchedSeasons[0].title
            .toLowerCase()
            .replace(/\s+/g, '-')         
            .replace(/[()]/g, '')        
            .replace(/[^a-z0-9-]/g, '');  
        
          navigate(`/erebus-empire/anime/${animeId}/${seasonId}`, { replace: true });
          setSelectedSeason(fetchedSeasons[0].url); 
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des saisons :", error);
      }
    };
    fetchSeasons();
  }, [animeUrl]);

  // Récupérer les épisodes en fonction de la saison sélectionnée
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!selectedSeason) return;
      try {
        setLoading(true);
        const episodeLinks = await window.electron.ipcRenderer.invoke('get-episodes', selectedSeason);
        setEpisodes(episodeLinks);
      } catch (error) {
        console.error("Erreur lors de la récupération des épisodes :", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEpisodes();
  }, [selectedSeason]);

  const handleSelectChange = (event) => {
    const newSeasonUrl = event.target.value;
    setSelectedSeason(newSeasonUrl);
  
    // Trouver la saison sélectionnée
    const selected = seasons.find(season => season.url === newSeasonUrl);
    
    if (selected) {
      const seasonId = selected.title
        .toLowerCase()
        .replace(/\s+/g, '-')         
        .replace(/[()]/g, '')     
        .replace(/[^a-z0-9-]/g, '');  
  
      navigate(`/erebus-empire/anime/${animeId}/${seasonId}`, { replace: true });
    }
  };

  const handleEpisodeClick = (episode) => {
    const episodeId = episode.title
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
      const selected = seasons.find(season => season.url === selectedSeason);
      const path = `/erebus-empire/anime/${animeId}/${seasonId}/${episodeId}`
    navigate(path, { 
      state: { 
        url: episode.url, 
        host:episode.host,
        episodeTitle: episode.title, 
        episodes: episodes, 
        animeId : animeId, 
        seasonId : seasonId, 
        animeTitle:animeInfo.title, 
        seasonTitle:selected.title,
        animeCover:animeInfo.cover
      }
    });
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="MainPage">
      {/* Cover Anime */}
      {animeInfo && (
        <div className="AnimeCover">
          <h2>{animeInfo.title}</h2>
          {animeInfo.cover && (
            <img
              draggable="false"
              src={animeInfo.cover}
              alt={animeInfo.title}
              className="AnimeCover-img"
            />
          )}
        </div>
      )}
      {/* Information de l'animé */}
      <div className='AnimeInfoText'>
        <h1>{animeInfo.altTitles.join(', ')}</h1>
      </div>
      {/* Sélecteur de saison */}
      {seasons.length > 0 && (
        <div>
          {seasons.length > 1 ? (
            <select
              id="saison"
              name="saison"
              value={selectedSeason}
              onChange={handleSelectChange}
              className="SelectSeason"
            >
              {seasons.map((season) => (
                <option key={season.url} value={season.url} className="OptionStyle">
                  {season.title + "⠀⠀"}
                </option>
              ))}
            </select>
          ) : (
            <p className="SingleSeasonTitle">{seasons[0].title}</p>
          )}
        </div>
      )}
      <div className='Space'></div>
      {/* Affichage des épisodes */}
      <div>
        <div className="CategorieTitle">Episodes :</div>
        {episodes.length > 0 ? (
          <div className="EpisodesList">
            {episodes
              .filter((episode) => episode.title != null) 
              .map((episode) => (
              <div
                key={episode.id}
                className="EpisodeItem"
                draggable="false"
                onClick={() => handleEpisodeClick(episode)}
              >
                <h2>{episode.title}</h2>
                {animeInfo.cover && (
                  <img
                    src={animeInfo.cover}
                    alt={episode.title}
                    className="EpisodeItem-img"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="NoEpisodes">Aucun épisode disponible</p>
        )}
      </div>
      <div className='Space'></div>
      <div className='AnimeInfoText'>
        <div className="CategorieTitle">Synopsis :</div>
        <div className='InfoBox'>
          <h2>{animeInfo.synopsis}</h2>
        </div>
        <div className='Space'></div>
        <div className="CategorieTitle">Genres :</div>
        <div className='InfoBox'>
          <h3>{animeInfo.genres.join(', ')}</h3>
        </div>
        <div className='Space'></div>
      </div>
    </div>
  );
};

export default SeasonsPage; 