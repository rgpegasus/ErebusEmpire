import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoader } from '@utils/PageDispatcher';
import { toSlug } from '@utils/toSlug'
import { FlagDispatcher } from '@utils/FlagDispatcher';

export const Season = () => {
  const { animeId, seasonId } = useParams();
  const navigate = useNavigate();
  const animeUrl = `https://anime-sama.fr/catalogue/${animeId}`;
  const [animeInfo, setAnimeInfo] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const { setLoading } = useLoader();
  const [episodeCache, setEpisodeCache] = useState({});



  useEffect(() => {
    const fetchAnimeInfo = async () => {
      try {
        setLoading(true); 
        const info = await window.electron.ipcRenderer.invoke('info-anime', animeUrl);
        setAnimeInfo(info);
        setLoading(false);
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
      setEpisodeCache({});
      const result = await window.electron.ipcRenderer.invoke('get-seasons', animeUrl);

      if (!result || result.error || !Array.isArray(result.seasons) || result.seasons.length === 0) {
        console.warn("Aucune saison trouvée ou erreur:", result?.error);
        setSeasons([]);
        setSelectedSeason(null);
        setLoading(false)
        return;
      }

      setSeasons(result.seasons);
      setSelectedLanguage(result.language)
      setSelectedSeason(result.seasons[0].url);

      const seasonId = result.seasons[0].url.split("/")[5];
      navigate(`/erebus-empire/anime/${animeId}/${seasonId}`, { replace: true });
    } catch (error) {
      console.error("Erreur lors de la récupération des saisons :", error);
      setSeasons([]);
      setSelectedSeason(null);
    } finally {
      setLoading(false)
    }
  };

  fetchSeasons();
}, [animeUrl]);


  // Récupérer les épisodes en fonction de la saison sélectionnée
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!selectedSeason || !selectedLanguage) return;

      setLoading(true);

      try {
        // On récupère toujours les langues disponibles (même si les épisodes sont en cache)
        const languages = await window.electron.ipcRenderer.invoke('get-available-languages', selectedSeason);
        setAvailableLanguages(languages);

        const seasonKey = selectedSeason.split("/").slice(0, 6).join("/") + "/";
        const cached = episodeCache[seasonKey]?.[selectedLanguage];

        if (cached) {
          setEpisodes(cached);
          return;
        }

        const episodeLinks = await window.electron.ipcRenderer.invoke('get-episodes', selectedSeason, true);
        setEpisodes(episodeLinks);

        setEpisodeCache(prevCache => ({
          ...prevCache,
          [seasonKey]: {
            ...(prevCache[seasonKey] || {}),
            [selectedLanguage]: episodeLinks
          }
        }));
      } catch (error) {
        console.error("Erreur lors de la récupération des épisodes :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEpisodes();
  }, [selectedSeason, selectedLanguage]);

  const handleSelectChange = (event) => {
    const newSeasonUrl = event.target.value;
    setSelectedSeason(newSeasonUrl);

    const selected = seasons.find(season => season.url === newSeasonUrl);
    
    if (selected) {
      const seasonId = selected.url.split("/").slice(5, 6).join("/");
      navigate(`/erebus-empire/anime/${animeId}/${seasonId}`, { replace: true });
    }
  };

const handleEpisodeClick = async (episode) => {
  setLoading(true); 
  const episodeId = toSlug(episode.title);
  const seasonKey = selectedSeason.split("/").slice(0, 6).join("/") + "/";
  const selectedSeasonData = seasons.find(season => season.url.includes(`/${selectedSeason.split("/")[5]}/`));
  const path = `/erebus-empire/anime/${animeId}/${seasonId}/${episodeId}`;

  try {
    const currentCache = episodeCache[seasonKey] || {};
    const missingLangs = availableLanguages.filter(lang => !currentCache[lang.toLowerCase()]);

    const newEntries = await Promise.all(
      missingLangs.map(async (lang) => {
        const langUrl = seasonKey + lang.toLowerCase();
        const eps = await window.electron.ipcRenderer.invoke('get-episodes', langUrl, true);
        return [lang.toLowerCase(), eps];
      })
    );

    const updatedCache = {
      ...currentCache,
      ...Object.fromEntries(newEntries)
    };
    setEpisodeCache(prev => ({
      ...prev,
      [seasonKey]: updatedCache
    }));
    navigate(path, {
      state: {
        episodeTitle: episode.title,
        episodes: updatedCache,
        animeId,
        seasonId,
        animeTitle: animeInfo.title,
        seasonTitle: selectedSeasonData?.title,
        animeCover: animeInfo.cover,
        seasonUrl: selectedSeason,
        availableLanguages,
        selectedLanguage
      }
    });
    setLoading(false)
  } catch (error) {
    console.error("Erreur dans handleEpisodeClick :", error);
  }
};
const [showStatusMenu, setShowStatusMenu] = useState(false);
const [animeStatus, setAnimeStatus] = useState({
  favoris: false,
  watchlist: false,
  attente: false,
  dejaVu: false,
});
  const buildAnimeData = () => ({
    animeId,
    animeTitle:animeInfo.title,
    animeCover: animeInfo.cover,
  });
// Map des statuts vers leurs "storageName" respectifs
const statusStorageMap = {
  favoris: "animeFavorites",
  watchlist: "animeWatchlist",
  attente: "animeOnHold",
  dejaVu: "animeAlreadySeen",
};

// Charger les statuts individuellement
useEffect(() => {
  const loadAllStatuses = async () => {
    const statusObj = { ...animeStatus };
    for (const key of Object.keys(statusObj)) {
      const storageName = statusStorageMap[key];
      const storageKey = animeId ? `/erebus-empire/anime/${animeId}` : null;
      const value = await animeData.load(storageName, storageKey);
      statusObj[key] = !!value; 
    }
    setAnimeStatus(statusObj);
  };
  loadAllStatuses();
}, [animeId]);

const toggleStatus = async (key) => {
  const isActive = animeStatus[key];
  const updatedStatus = { ...animeStatus, [key]: !isActive };
  setAnimeStatus(updatedStatus);

  const storageName = statusStorageMap[key];
  const storageKey = animeId ? `/erebus-empire/anime/${animeId}` : null;

  if (!isActive) {
    console.log(storageName, storageKey, animeId, animeInfo.animeTitle, animeCover)
    await animeData.save(storageName, storageKey, buildAnimeData());
  } else {
    await animeData.delete(storageName, storageKey);
  }
};


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
        <h1>{animeInfo?.altTitles.join(', ')}</h1>
      </div>

      {/* Sélecteur de saison */}
      <div className='SeasonsPageTop'>    
        <div className='SeasonsPageTop-item'>
          {seasons.length > 0 &&  (
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
        <div className='availableLanguages'>
          {availableLanguages.map((lang, index) => {
            const flag = FlagDispatcher(lang.toLowerCase());
            return (
              <span
                key={index}
                className={`LanguageItem${selectedLanguage === lang.toLowerCase() ? ' selected' : ''}`}
              >
                {flag && (
                  <img
                    onClick={() => {
                      setSelectedLanguage(lang.toLowerCase());
                      setSelectedSeason(selectedSeason.split("/").slice(0, 6).join("/") + "/" + lang.toLowerCase());
                    }}
                    src={flag}
                    alt={lang}
                    draggable='false'
                    className={`LanguageItem-img${selectedLanguage === lang.toLowerCase() ? ' selected' : ''}`}
                  />
                )}
                <div className={`LanguageItem-txt${selectedLanguage === lang.toLowerCase() ? ' selected' : ''}`}>
                  {lang.toUpperCase()}
                </div>
              </span>
            );
          })}
        </div>
          
          {/* Bouton Ajouter */}
          {episodes.length > 0 && (<div className="StatusMenuContainer">
            <button className="AddStatusButton" onClick={() => setShowStatusMenu(!showStatusMenu)}>＋ Ajouter</button>
            {showStatusMenu && (
              <div className="StatusDropdown">
                {["favoris", "watchlist", "attente", "dejaVu"].map((key) => (
                  <label key={key} className="StatusItem">
                    <input
                      type="checkbox"
                      checked={animeStatus[key]}
                      onChange={() => toggleStatus(key)}
                    />
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                ))}
              </div>
            )}
          </div>)}
        </div>

      </div>
      
      <div className='Space'></div>
      {/* Affichage des épisodes */}
      <div className="CategorieTitle">Episodes :</div>
      <div className='EpisodeAll' >
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
          <div className="AFK">
            <p>Aucun épisode disponible</p>
          </div>
        )}
      </div>
      <div className='AnimeInfoText'>
        
        {animeInfo?.synopsis && (
          <>
            <div className='Space'></div>
            <div className="CategorieTitle">Synopsis :</div>
            <div className='InfoBox'>
              <h2>{animeInfo?.synopsis}</h2>
            </div>
          </>
        )}
        {animeInfo?.genres && (
          <>
            <div className='Space'></div>
            <div className="CategorieTitle">Genres :</div>
            <div className='InfoBox'>
              <h3>{animeInfo?.genres.join(', ')}</h3>
            </div>
          </>
        )}
        <div className='Space'></div>
      </div>
    </div>
  );
};
