import React, { useEffect, useState } from 'react';
import { Loader} from '@utils/PageDispatcher'
import LatestEpisodes from '@components/latest-episodes';
import WatchHistory from '@components/watchHistory';
import { useNavigate } from 'react-router-dom';
export const Home = () => {
  const [anime, setAnime] = useState(null);
  const [latestEpisodes, setLatestEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  
  const [dataLoaded, setDataLoaded] = useState(false); 
  const navigate = useNavigate();

useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let animeData = await animeCover.load();
        if (!animeData) {
          animeData = await window.electron.ipcRenderer.invoke('random-anime');
          animeCover.save(animeData);
        }
        setAnime(animeData);
        const episodes = await window.electron.ipcRenderer.invoke('get-latest-episode');
        setLatestEpisodes(episodes || []);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Une erreur est survenue lors du chargement des données.');
      } finally {
        setLoading(false);
        setDataLoaded(true);  
      }
    };
    if (!dataLoaded) {
      fetchData();
    }

    const handleFocus = () => {
      if (!dataLoaded) {
        fetchData();
      }
    };
  
    window.addEventListener('focus', handleFocus);
  
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [dataLoaded]);  

  const getAnimeId = (url) => {
    const cleanUrl = new URL(url);
    const pathname = cleanUrl.pathname.replace(/\/$/, '');
    const parts = pathname.split('/').filter(Boolean);
    return parts[parts.length - 1]; 
  };

  const handleClick = (url) => {
    navigate(`/erebus-empire/anime/${getAnimeId(url)}/`);
  };

  if (loading) return <Loader />;

  return (
    <div className='MainPage'>
      {error && <div className="error">{error}</div>}  
      {anime?.cover && (
        <div className="AnimeCover">
          <h2>{anime.title}</h2>
          <img
            draggable="false"
            src={anime.cover}
            alt={anime.title}
            className='AnimeCover-img'  
          />
          <div className='AnimeCover-button' onClick={() => handleClick(anime.url)}>Regarder</div>
        </div>
      )}
      <WatchHistory />
      <LatestEpisodes episodes={latestEpisodes} />
      <div className='Space'></div>
    </div>
  );
};

