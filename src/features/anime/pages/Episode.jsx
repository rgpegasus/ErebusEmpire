import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader} from '@utils/PageDispatcher'
import { ErebusPlayer } from '@features/anime/components/player/VideoPlayer';

export const Episode = () => {
  const navigate = useNavigate();
  
  const location = useLocation();
  const [loadingEpisode, setLoadingEpisode] = useState(false);
  const { 
    url, 
    host,
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
  const [restored, setRestored] = useState(false);

  

  function updatePresence(animeTitle, episodeNumber) {
    window.electron.ipcRenderer.send('update-rich-presence', {
        anime: animeTitle,
        episode: episodeNumber,
    });
}

useEffect(() => {
  return () => {
    window.electron.ipcRenderer.send('defaul-rich-presence');
  };
}, []); 


  useEffect(() => { 
  if (url && host) {
    fetchEpisode(url, host);
  } 
}, [url, host]); 
 

  const fetchEpisode = async (url, host) => {
    try {  
      setLoadingEpisode(true);
      const realUrl = await window.electron.ipcRenderer.invoke('get-url', url, host);
      setEpisodeUrl(realUrl || url);
      const seasonEpisode = `${seasonTitle} - ${episodeTitle}`
      updatePresence(animeTitle, seasonEpisode)
    } catch (error) {
      console.error("Erreur lors du chargement de l'épisode :", error);
      setEpisodeUrl(url);
    } finally {
      setLoadingEpisode(false);
    }
  }; 
  
  const EndEpisodeNext = (episode) => {
    const episodeId = `${episode.title.toLowerCase().replace(/\s+/g, '-')}`
    if (episode) {
      navigate(
        `/erebus-empire/anime/${animeId}/${seasonId}/${episodeId}`, 
        {
          state: {
            url: episode.url,
            host: episode.host,
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
    const episodeId = `${episode.title.toLowerCase().replace(/\s+/g, '-')}`
    if (episode) {
      navigate(
        `/erebus-empire/anime/${animeId}/${seasonId}/${episodeId}`,
        { state: { 
          url: episode.url, 
          host: episode.host,
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

const videoTimeRef = useRef(videoTime);

useEffect(() => {
  videoTimeRef.current = videoTime;
}, [videoTime]);

const episodeId = episodeTitle?.toLowerCase().replace(/\s+/g, '-');
const storageKey = episodeId
  ? `/erebus-empire/anime/${animeId}/${seasonId}/${episodeId}`
  : null;

const buildWatchData = () => ({
  url,
  host,
  animeId,
  seasonId,
  episodeId,
  episodeTitle,
  animeTitle,
  seasonTitle,
  animeCover,
  timestamp: Date.now(),
  videoTime: videoTimeRef.current,
  episodes,
});

useEffect(() => {
  if (!storageKey) return;
  animeWatchHistory.load(storageKey).then((data) => {
    const time = parseFloat(data?.videoTime || 0);
    setVideoTime(time);
    videoTimeRef.current = time;
    setRestored(true);
  });
}, [storageKey]);

useEffect(() => { 
  if (!restored || !storageKey) return;
  const intervalId = setInterval(() => {
    animeWatchHistory.save(storageKey, buildWatchData());
  }, 5000);
  return () => {
    clearInterval(intervalId);
    animeWatchHistory.save(storageKey, buildWatchData());
  };
}, [restored, storageKey]);



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
  

if (loadingEpisode || !restored) {
  return <Loader />;
}

  return ( 
    <div className="EpisodesPage">
      <ErebusPlayer
        src={EpisodeUrl}
        overlayEnabled={true}
        title={animeTitle}
        subTitle={`${seasonTitle} - ${episodeTitle}`}
        titleMedia={`${animeTitle} - ${seasonTitle} : ${episodeTitle}`}
        autoControllCloseEnabled={true}
        fullPlayer={false}
        autoPlay={true}
        startPosition={videoTime}  
        onEnded={() => EndEpisodeNext(nextEpisode)}
        dataNext={nextEpisode ? {
          id: nextEpisode.title.toLowerCase().replace(/\s+/g, '-'), 
          title: nextEpisode.title,
        } : null}
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