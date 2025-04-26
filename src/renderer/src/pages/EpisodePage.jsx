import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loader from '../components/loader';
import { VideoPlayer } from '../components/video-player/src';

const EpisodePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingEpisode, setLoadingEpisode] = useState(false);
  const { 
    url, 
    episodeTitle, 
    episodes, 
    animeId, 
    seasonId, 
    animeTitle, 
    seasonTitle, 
    animeCover 
  } = location.state || {};
  const episodeIndex = episodes.findIndex(
    (ep) => ep.title.toLowerCase().replace(/\s+/g, '-') === episodeTitle.toLowerCase().replace(/\s+/g, '-')
  );

  const nextEpisode = episodes[episodeIndex + 1];
  const [EpisodeUrl, setEpisodeUrl] = useState(url);
  const [videoTime, setVideoTime] = useState(0);



  useEffect(() => {
    if (url) {
      fetchEpisode(url);
    }
  }, [url]);

  const fetchEpisode = async (url) => {
    try {
      setLoadingEpisode(true);
      const realUrl = await window.electron.ipcRenderer.invoke('get-url', url);
      setEpisodeUrl(realUrl || url);
    } catch (error) {
      console.error("Erreur lors du chargement de l'épisode :", error);
      setEpisodeUrl(url);
    } finally {
      setLoadingEpisode(false);
    }
  };

  const EndEpisodeNext = (episode) => {
    if (episode) {
      navigate(
        `/erebus-empire/anime/${animeId}/${seasonId}/${episode.title.toLowerCase().replace(/\s+/g, '-')}`,
        {
          state: {
            url: episode.url,
            episodeTitle: episode.title,
            episodes,
            animeId,
            seasonId,
            animeTitle,
            seasonTitle,
            animeCover,
            skipFrom: location.pathname,  
          },
        }
      );
    }
  };

  const handleNavigation = (episode) => {
    if (episode) {
      navigate(
        `/erebus-empire/anime/${animeId}/${seasonId}/${episode.title.toLowerCase().replace(/\s+/g, '-')}`,
        { state: { 
          url: episode.url, 
          episodeTitle: episode.title, 
          episodes, 
          animeId, 
          seasonId, 
          animeTitle, 
          seasonTitle, 
          animeCover
        } }
      );
    }
  };
  const BackMenu = () => {
    navigate("/erebus-empire/home")
  };
  const BackSeason = () => {
    navigate(`/erebus-empire/anime/${animeId}`)
  };

  useEffect(() => {
    if (location.state?.skipFrom) {
      localStorage.removeItem(location.state.skipFrom);
    }
    // Enregistre le dernier épisode vu pour cet anime + saison
    if (animeId && seasonId && episodeTitle) {
      const historyKey = `lastWatched_${animeId}_${seasonId}`;
      localStorage.setItem(historyKey, JSON.stringify({
        url, 
        episodeTitle, 
        episodes, 
        animeId, 
        seasonId, 
        animeTitle, 
        seasonTitle, 
        animeCover,
        timestamp: Date.now(),
      }));
    }

    const storedTime = localStorage.getItem(location.pathname);
    console.log(location.pathname)
    if (storedTime) {
      setVideoTime(parseFloat(storedTime)); 
    } else {
      setVideoTime(0); 
    }
    return () => {
      setTimeout(() => {
        localStorage.setItem(location.pathname, videoTime.toString());
      }, 100);
    };
  }, [location.pathname, videoTime]);

  const handleVideoTimeUpdate = (event) => {
    const currentTime = event.nativeEvent.target.currentTime;
    if (typeof currentTime === 'number' && currentTime !== videoTime) {
      setVideoTime(currentTime);
    }
  };

  const handleDownload = async () => {
    try {
      alert("Téléchargement commence");     
      await window.electron.ipcRenderer.invoke('download-video', EpisodeUrl, {
        episodeTitle,
        seasonTitle,
        animeTitle,
        animeCover, 
      });
  
      alert("Téléchargement terminé !");
    } catch (error) {
      console.error("Erreur lors du téléchargement de la vidéo :", error);
    }
  };
  

  if (loadingEpisode) {
    return <Loader />;
  }

  return (
    <div className="MainPage">
      <VideoPlayer
        src={EpisodeUrl}
        overlayEnabled={true}
        title={animeTitle}
        subTitle={`${seasonTitle} - ${episodeTitle}`}
        titleMedia={`${animeTitle} - ${seasonTitle} : ${episodeTitle}`}
        autoControllCloseEnabled={true}
        fullPlayer={false}
        playerLanguage="fr"
        autoPlay={true}
        startPosition={videoTime}  
        playbackRateEnable={false}
        onEnded={() => EndEpisodeNext(nextEpisode)}
        primaryColor='#996e35'
        onNextClick={() => EndEpisodeNext(nextEpisode)}
        onClickItemListReproduction={(slug) => {
          const episode = episodes.find(
            (ep) => ep.title.toLowerCase().replace(/\s+/g, '-') === slug
          );
          if (episode) handleNavigation(episode);
        }}
        reprodutionList={episodes.map((ep) => ({
          id: ep.title.toLowerCase().replace(/\s+/g, '-'),
          name: ep.title,
          playing:
            ep.title.toLowerCase().replace(/\s+/g, '-') ===
            episodeTitle.toLowerCase().replace(/\s+/g, '-'),
        }))}
        onTimeUpdate={handleVideoTimeUpdate} 
        onCrossClick={BackMenu}
        backButton={BackSeason}
        onDownloadClick={handleDownload}
      />
    </div>
  );
};

export default EpisodePage;