import React, { useState, useEffect, useRef } from 'react';
import styles from "./Season.module.css"
import useEmblaCarousel from "embla-carousel-react";
import { useParams, useNavigate } from 'react-router-dom';
import { useLoader } from '@utils/dispatchers/Page';
import { toSlug } from '@utils/functions/toSlug'
import BackgroundCover from "@components/background-cover/BackgroundCover"
import ContentsCarousel from '@components/contents-carousel/ContentsCarousel';

export const Season = () => {
  const { animeId, seasonId } = useParams();
  const navigate = useNavigate(); 
  const [animeUrl, setBaseUrl] = useState(null)

  useEffect(() => {
    const fetchBaseUrl = async () => {
      try {
        const url = await window.electron.ipcRenderer.invoke("get-working-url");
        setBaseUrl(`${url}/catalogue/${animeId}`)
      } catch (err) {
        console.error("Erreur récupération embed:", err)
      }
    }
    fetchBaseUrl()
  }, [])
  

  const [animeInfo, setAnimeInfo] = useState(null);
  const [coverInfo, setCoverInfo] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [contentType, setContentType] = useState("anime"); 
  const { setLoading } = useLoader();
  
  const [episodeCache, setEpisodeCache] = useState({});
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: true, skipSnaps: false })

  const [availableContentTypes, setAvailableContentTypes] = useState({
    hasAnime: false,
    hasManga: false
  });

  useEffect(() => {
    if (!emblaApi || seasons.length === 0) return;

    const selectedIndex = seasons.findIndex(season => season.url === selectedSeason);
    if (selectedIndex >= 0) {
      emblaApi.scrollTo(selectedIndex, true); 
    }
  }, [emblaApi, selectedSeason, seasons]);

  useEffect(() => {
    if (!animeUrl) return;
    const fetchAnimeInfo = async () => {
      try {
        setLoading(true); 
        const info = await window.electron.ipcRenderer.invoke('info-anime', animeUrl);
        if (!info || !info.title) {
          navigate("/" + animeId); 
          return;
        }
        setAnimeInfo(info);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des informations de l'anime :", error);
      } 
    };
    fetchAnimeInfo();
  }, [animeUrl]);

  useEffect(() => {
    if (!animeUrl) return
    const fetchSeasons = async () => {
      try {
        setLoading(true);
        setEpisodeCache({});
        const result = await window.electron.ipcRenderer.invoke('get-seasons', animeUrl);

        if (!result || result.error || !Array.isArray(result.seasons) || result?.seasons?.length === 0) {
          console.warn("Aucune saison trouvée ou erreur:", result?.error);
          setSeasons([]);
          setSelectedSeason(null);
          setLoading(false);
          return;
        }

        setSeasons(result.seasons);
        setSelectedLanguage(result.language);
        
        const animeSeasons = result.seasons.filter(season => !season.url.includes("scan"));
        const scanSeasons = result.seasons.filter(season => season.url.includes("scan"));
        
        setAvailableContentTypes({
          hasAnime: animeSeasons.length > 0,
          hasManga: scanSeasons.length > 0
        });

        const currentSeason = result.seasons.find(s => s.url.split("/")[5] === seasonId);
        if (currentSeason) {
          setSelectedSeason(currentSeason.url);
          if (currentSeason.url.includes("scan")) {
            setContentType("manga");
          } else {
            setContentType("anime");
          }
        } else {
          const firstAnimeSeason = animeSeasons[0] || result.seasons[0];
          setSelectedSeason(firstAnimeSeason.url);
          const defaultSeasonId = firstAnimeSeason.url.split("/")[5];
          navigate(`/erebus-empire/${animeId}/${defaultSeasonId}`, { replace: true });
          setContentType(firstAnimeSeason.url.includes("scan") ? "manga" : "anime");
        }

      } catch (error) {
        console.error("Erreur lors de la récupération des saisons :", error);
        setSeasons([]);
        setSelectedSeason(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSeasons();
  }, [animeUrl, seasonId]);

  const filteredSeasons = (() => {
    const seenUrls = new Set();
    return seasons.filter(season => {
      const isAnimeSeason = !season.url.includes("scan");
      const matchesType = contentType === "anime" ? isAnimeSeason : !isAnimeSeason;

      if (!matchesType) return false;
      if (seenUrls.has(season.url)) return false;

      seenUrls.add(season.url);
      return true;
    });
  })();
  useEffect(() => {
    if (filteredSeasons.length > 0 && !filteredSeasons.some(season => season.url === selectedSeason)) {
      const newSelectedSeason = filteredSeasons[0].url;
      setSelectedSeason(newSelectedSeason);
      const seasonIdPart = newSelectedSeason.split("/")[5];
      navigate(`/erebus-empire/${animeId}/${seasonIdPart}`, { replace: true });
    }
  }, [contentType, filteredSeasons]);

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!selectedSeason || selectedSeason.includes("scan") || !selectedLanguage ) return;
      
      setLoading(true);
      try {
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
    
    if (contentType === "anime" && selectedSeason && !selectedSeason.includes("scan")) {
      fetchEpisodes();
    } else {
      setEpisodes([]);
    }
  }, [selectedSeason, selectedLanguage, contentType]);

  useEffect(() => {
    const fetchScans = async () => {
      if (!selectedSeason || !selectedSeason.includes("scan")) return;
      
      setLoading(true);
      try {
        const language = selectedSeason.split("/").slice(6, 7).join("/");
        setAvailableLanguages([language])
        setSelectedLanguage(language)
        const episodeLinks = await window.electron.ipcRenderer.invoke('get-scans-chapter', selectedSeason);
        setEpisodes(Object.entries(episodeLinks).map(([key, ep]) => ({id: key, title: ep.title})))              
        
      } catch (error) {
        console.error("Erreur lors de la récupération des scans :", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (contentType === "manga" && selectedSeason && selectedSeason.includes("scan")) {
      fetchScans();
    } else {
      setEpisodes([]);
    }
  }, [selectedSeason, selectedLanguage, contentType]);

  const handleLanguageChange = (lang) => {
    const newLanguage = lang.toLowerCase();
    setSelectedLanguage(newLanguage);
    
    const baseSeasonUrl = selectedSeason.split("/").slice(0, 6).join("/");
    const newSeasonUrl = `${baseSeasonUrl}/${newLanguage}`;
    setSelectedSeason(newSeasonUrl);
  };

  const handleSelectChange = (season) => {
    if (!season) return;

    const newSeasonUrl = season.url;
    setSelectedSeason(newSeasonUrl);

    const seasonIdPart = newSeasonUrl.split("/")[5];
    navigate(`/erebus-empire/${animeId}/${seasonIdPart}`, { replace: true });
  };

  const handleContentTypeChange = (newType) => {
    setContentType(newType);
  
    const newTypeSeasons = seasons.filter(season => {
      if (newType === "anime") {
        return !season.url.includes("scan");
      } else {
        return season.url.includes("scan");
      }
    });

    if (newTypeSeasons.length > 0) {
      const firstSeasonOfNewType = newTypeSeasons[0];
      setSelectedSeason(firstSeasonOfNewType.url);
      const seasonIdPart = firstSeasonOfNewType.url.split("/")[5];
      navigate(`/erebus-empire/${animeId}/${seasonIdPart}`, { replace: true });
    }
  };

  const handleEpisodeClick = async (episode) => {
    setLoading(true); 
    const episodeId = toSlug(episode.title);
    const seasonKey = selectedSeason.split("/").slice(0, 6).join("/") + "/";
    const selectedSeasonData = seasons.find(season => season.url.includes(`/${selectedSeason.split("/")[5]}/`));
    const path = `/erebus-empire/${animeId}/${seasonId}/${episodeId}`;
    
    if (contentType === "anime") {
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
    } else if (contentType === "manga") {
      try {
        const scansImg = await window.electron.ipcRenderer.invoke('get-scans-img', selectedSeason, episode.id);
        navigate(path, {
          state: {
            episodeTitle: episode.title,
            scans: scansImg,
            episodes:episode,
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
    }
  };

  useEffect(()=> {
    if (!animeInfo) return;
    const info = {
      ...animeInfo,
      url: animeUrl
    };
    setCoverInfo(info)
  }, [animeInfo])

  return (
    <div className='MainPage'>
      <BackgroundCover 
        coverInfo = {coverInfo}
        whileWatching = {true}
        isAnime = {true}
      />
      <div className={styles.SeasonContainer}>    
        {filteredSeasons.length > 0 && (
          <div className={styles.EmblaViewport} ref={emblaRef}>
            <div className={styles.EmblaContainer}>
              {filteredSeasons.map((season) => {
                const isActive = season.url === selectedSeason; 
                return (
                  <div
                    key={season.id}
                    onClick={() => handleSelectChange(season)}
                    className={`${styles.SeasonItem} ${isActive ? styles.ActiveSeason : ''}`}
                  >
                    {season.title}
                  </div>
                );
              })}
            </div>
          </div>
        )}     
        
      </div>
      
      <div className={styles.Container}>
        <ContentsCarousel
          data={episodes}
          onClickEpisode={handleEpisodeClick}
          getEpisodeCover={() => animeInfo?.cover}
          getAnimeTitle={() => animeInfo?.title}
          getEpisodeSubTitle={(ep) => {
            const seasonTitle = seasons.find(season => season.url.includes(`/${selectedSeason.split("/")[5]}/`))?.title;
            return `${seasonTitle} - ${ep.title}`;
          }}
          getEpisodeTitle={(ep) => ep.title}
          getUrlErebus = {(ep) => `/erebus-empire/${ep.animeId}/${ep.seasonId}/${ep.episodeId}`}
          currentLanguage={selectedLanguage}
          isSeason={true}
          availableLanguages={availableLanguages}
          onLanguageChange={handleLanguageChange}
          searchBy={"episode"}
          onContentTypeChange={handleContentTypeChange}
          availableContentTypes={availableContentTypes}
          contentType={contentType}
        />
      </div>
    </div>
  );
};