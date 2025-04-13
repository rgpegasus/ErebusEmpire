import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Loader from '../components/loader';

const SeasonsPage = () => {
  const { animeId } = useParams();
  const animeUrl = decodeURIComponent(animeId);
  const location = useLocation();
  const [animeInfo, setAnimeInfo] = useState(null); // État pour info de l'anime

  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingEpisode, setLoadingEpisode] = useState(false);

  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [currentEpisodeUrl, setCurrentEpisodeUrl] = useState(null);

  // Récupérer les informations de l'anime
  useEffect(() => {
    const fetchAnimeInfo = async () => {
      try {
        const info = await window.electron.ipcRenderer.invoke('info-anime', animeUrl); // Récupérer l'info
        setAnimeInfo(info);
      } catch (error) {
        console.error("Erreur lors de la récupération des informations de l'anime :", error);
      }
    };
    fetchAnimeInfo();
  }, [animeUrl]);

  // Réinitialisation quand l'anime change
  useEffect(() => {
    setSeasons([]);
    setSelectedSeason("");
    setCurrentEpisodeIndex(0);
    setCurrentEpisodeUrl(null);
  }, [animeUrl]);

  // Récupérer les saisons
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        setLoadingSeasons(true);
        const fetchedSeasons = await window.electron.ipcRenderer.invoke('get-seasons', animeUrl);
        setSeasons(fetchedSeasons);
        if (fetchedSeasons.length > 0) {
          setSelectedSeason(fetchedSeasons[0].url);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des saisons :", error);
      } finally {
        setLoadingSeasons(false);
      }
    };

    fetchSeasons();
  }, [animeUrl]);

  // Charger un épisode à la fois
  const fetchCurrentEpisode = async (seasonUrl, index) => {
    try {
      setLoadingEpisode(true);
      const episodeLinks = await window.electron.ipcRenderer.invoke('get-episodes', seasonUrl);
      const embedUrl = episodeLinks[index];
      const realUrl = await window.electron.ipcRenderer.invoke('get-url', embedUrl);
      setCurrentEpisodeUrl(realUrl || embedUrl);
    } catch (error) {
      console.error("Erreur lors du chargement de l'épisode :", error);
    } finally {
      setLoadingEpisode(false);
    }
  };

  // Charger l'épisode quand la saison ou l'index change
  useEffect(() => {
    if (selectedSeason) {
      fetchCurrentEpisode(selectedSeason, currentEpisodeIndex);
    }
  }, [selectedSeason, currentEpisodeIndex]);

  const handleSelectChange = (event) => {
    setSelectedSeason(event.target.value);
    setCurrentEpisodeIndex(0); // Réinitialiser l'épisode
  };

  const handlePreviousEpisode = () => {
    setCurrentEpisodeIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNextEpisode = () => {
    setCurrentEpisodeIndex((prev) => prev + 1); // On laisse l'utilisateur cliquer suivant sans limiter (peut gérer dynamiquement)
  };

  return (
    <div className="MainPage">
      {/* Affichage de l'info de l'anime */}
      {animeInfo ? (
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
      ) : (
        <Loader />
      )}

      {/* Sélecteur de saison */}
      {loadingSeasons ? (
        <Loader />
      ) : seasons.length > 0 ? (
        <select
          id="saison"
          name="saison"
          value={selectedSeason}
          onChange={handleSelectChange}
          className="SelectSeason"
        >
          {seasons.map((season, index) => (
            <option key={index} value={season.url} className="OptionStyle">
              {season.title}
            </option>
          ))}
        </select>
      ) : (
        <p>Aucune saison disponible</p>
      )}

      {/* Vidéo et navigation */}
      {loadingEpisode ? (
        <Loader />
      ) : currentEpisodeUrl && (
        <div className="VideoPlayer">
          <iframe
            src={currentEpisodeUrl}
            width="100%"
            height="500px"
            frameBorder="0"
            allowFullScreen
            title="Video Player"
          ></iframe>
          <div className="EpisodeNavigation">
            <button
              onClick={handlePreviousEpisode}
              disabled={currentEpisodeIndex === 0}
              className="NavigationButton"
            >
              Précédent
            </button>
            <button
              onClick={handleNextEpisode}
              className="NavigationButton"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonsPage;
