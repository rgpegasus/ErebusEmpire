import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLoader, Loader } from '@utils/dispatchers/Page'; 
import { ErebusPlayer } from '@components/video-player/VideoPlayer';

export const Episode = () => {  
  const navigate = useNavigate();
  const location = useLocation();
  const {
    episodeTitle,
    episodes,
    animeId,
    seasonId,
    animeTitle,
    seasonTitle,
    animeCover,
    seasonUrl,
    availableLanguages,
    selectedLanguage
  } = location.state || {};
  const { loading, setLoading } = useLoader();
  const [episodeSources, setEpisodeSources] = useState(null);
  const [episodeUrl, setEpisodeUrl] = useState(undefined);
  const [availableLanguagesEpisode, setAvailableLanguagesEpisode] = useState(undefined);
  const [videoTime, setVideoTime] = useState(0);
  const [restored, setRestored] = useState(false);
  const intervalRef = useRef(null);
  const skipFinalSaveRef = useRef(false);
  const videoTimeRef = useRef(videoTime);
  const [resolvedSources, setResolvedSources] = useState([]);
  const lastPresenceUpdateRef = useRef(0);

  const episodeIndex = episodes?.[selectedLanguage]?.findIndex(
    (ep) => ep.title?.toLowerCase().replace(/\s+/g, '-') === episodeTitle?.toLowerCase()?.replace(/\s+/g, '-')
  );

  
  useEffect(() => {
    const EpisodeLanguages = availableLanguages?.filter((lang) => {
      const epList = episodes[lang.toLowerCase()];
      return epList && epList.length > episodeIndex && epList[episodeIndex]?.title;
    });
    setAvailableLanguagesEpisode(EpisodeLanguages)
    if (
      selectedLanguage &&
      episodeIndex !== -1 &&
      episodes[selectedLanguage] &&
      episodes[selectedLanguage][episodeIndex]
    ) {

      
      setEpisodeSources(episodes[selectedLanguage][episodeIndex]);
    }
  }, [selectedLanguage, episodeIndex, episodes]);

  const nextEpisode = episodes?.[selectedLanguage]?.[episodeIndex + 1];

  const episodeId = episodeTitle?.toLowerCase().replace(/\s+/g, '-');
  const storageKey = episodeId ? `/erebus-empire/anime/${animeId}/${seasonId}/${episodeId}` : null;

  const updatePresence = (animeTitle, episodeNumber, animeCover, currentTime, duration) => {
    const now = Date.now();
    const start = now - currentTime * 1000;
    const end = start + duration * 1000;

    window.electron.ipcRenderer.send('update-rich-presence', {
      anime: animeTitle,
      episode: episodeNumber,
      cover: animeCover,
      startTimestamp: start,
      endTimestamp: end,
    });
  };


  useEffect(() => {
    return () => {
      window.electron.ipcRenderer.send('defaul-rich-presence');
    };
  }, []);

useEffect(() => {
  const resolveAllSources = async () => {
    if (!episodeSources?.url || !episodeSources?.host) return;

    try {
      setLoading(true);

      const resolvedUrls = await Promise.all(
        episodeSources.url?.map((epUrl, index) =>
          window.electron.ipcRenderer.invoke('get-url', epUrl, episodeSources.host[index])
        )
      );

      const updatedSources = {
        ...episodeSources,
        url: resolvedUrls,
      };

      setResolvedSources(updatedSources);
      setEpisodeUrl(resolvedUrls[0]);
      updatePresence(animeTitle, `${seasonTitle} - ${episodeTitle}`, animeCover);
    } catch (err) {
      console.error("Erreur lors de la résolution des sources :", err);
      setEpisodeUrl(episodeSources.url[0]);
    } finally {
      setLoading(false);
    }
  };

  resolveAllSources();
}, [episodeSources, selectedLanguage]);

  useEffect(() => {
    videoTimeRef.current = videoTime;
  }, [videoTime]);

  const buildWatchData = () => ({
    animeId,
    seasonId,
    episodeId,
    episodeTitle,
    animeTitle,
    seasonTitle,
    animeCover,
    timestamp: Date.now(),
    videoTime: videoTimeRef.current,
    seasonUrl,
    availableLanguages,
    selectedLanguage
  });
const changeLanguage = (lang) => {
  if (!episodes[lang]) return;
  const newEpisode = episodes[lang][episodeIndex];
  if (!newEpisode) return;
  setEpisodeSources(newEpisode);
  navigate(location.pathname, {
    replace: true,
    state: {
      ...location.state,
      selectedLanguage: lang,
    },
  });
};

  useEffect(() => {
    if (!storageKey) return;
    animeData.load("animeWatchHistory", storageKey).then((data) => {
      const time = parseFloat(data?.videoTime || 0);
      setVideoTime(time);
      videoTimeRef.current = time;
      setRestored(true);
    });
  }, [storageKey]);

  useEffect(() => {
    if (!restored || !storageKey) return;
    intervalRef.current = setInterval(() => {
      animeData.save("animeWatchHistory", storageKey, buildWatchData());
    }, 5000);

    return () => {
      clearInterval(intervalRef.current);
      if (!skipFinalSaveRef.current) {
        animeData.save("animeWatchHistory", storageKey, buildWatchData());
      }
    };
  }, [restored, storageKey]);

  useEffect(() => {
    skipFinalSaveRef.current = false;
  }, [storageKey]);

  const EndEpisodeNext = (episode) => {
    skipFinalSaveRef.current = true;
    clearInterval(intervalRef.current);
    animeData.delete("animeWatchHistory", storageKey);
    const episodeId = `${episode.title.toLowerCase().replace(/\s+/g, '-')}`;
    navigate(`/erebus-empire/anime/${animeId}/${seasonId}/${episodeId}`, {
      state: {
        ...location.state,
        episodeTitle: episode.title,
      },
    });
  };

  const handleNavigation = (episode) => {
    const episodeId = `${episode.title.toLowerCase().replace(/\s+/g, '-')}`;
    navigate(`/erebus-empire/anime/${animeId}/${seasonId}/${episodeId}`, {
      state: {
        ...location.state,
        episodeTitle: episode.title,
      },
    });
  };

  const BackMenu = () => navigate("/erebus-empire/home");
  const BackSeason = () => navigate(`/erebus-empire/anime/${animeId}`);

  const handleVideoTimeUpdate = ({ currentTime, duration }) => {
    if (typeof currentTime === 'number' && currentTime !== videoTime) {
      setVideoTime(currentTime);

      const now = Date.now();
      if (now - lastPresenceUpdateRef.current >= 5000 && duration) {
        lastPresenceUpdateRef.current = now;
        updatePresence(
          animeTitle,
          `${seasonTitle} - ${episodeTitle}`,
          animeCover,
          currentTime,
          duration
        );
      }
    }
  };


  const handleDownload = async () => {
    try {
      alert("Téléchargement commence");
      await window.electron.ipcRenderer.invoke('download-video', episodeUrl, {
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

  if (loading || !restored ) {
    return <Loader />;
  }

  return (
    <div className="EpisodesPage">
      <ErebusPlayer
        src={episodeUrl}
        overlayEnabled={true}
        cover={animeCover}
        title={animeTitle}
        subTitle={`${seasonTitle} - ${episodeTitle}`}
        titleMedia={`${animeTitle} - ${seasonTitle} : ${episodeTitle}`}
        autoControllCloseEnabled={true}
        fullPlayer={true}
        autoPlay={true}
        startPosition={videoTime}
        onEnded={() => EndEpisodeNext(nextEpisode)}
        dataNext={nextEpisode ? {
          id: nextEpisode.title.toLowerCase().replace(/\s+/g, '-'),
          title: nextEpisode.title,
        } : null}
        onNextClick={() => EndEpisodeNext(nextEpisode)}
        onClickItemListReproduction={(slug) => {
          const episode = episodes[selectedLanguage]?.find(
            (ep) => ep.title.toLowerCase().replace(/\s+/g, '-') === slug
          );
          if (episode) handleNavigation(episode);
        }}
        reprodutionList={episodes[selectedLanguage]?.map((ep) => ({
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
        episodeSources={resolvedSources}
        availableLanguages={availableLanguagesEpisode}
        currentLanguage={selectedLanguage}
        onChangeLanguage={changeLanguage}
      />
    </div>
  );
};
