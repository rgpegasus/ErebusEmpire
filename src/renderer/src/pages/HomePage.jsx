import React, { useEffect, useState } from 'react';
import Loader from '../components/loader';
import LatestEpisodes from '../components/latest-episodes';
import WatchHistory from '../components/watchHistory';

const HomePage = () => {
  const [anime, setAnime] = useState(null);
  const [latestEpisodes, setLatestEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const storedAnime = sessionStorage.getItem('anime');
        const animeData = storedAnime 
          ? JSON.parse(storedAnime) 
          : await window.electron.ipcRenderer.invoke('random-anime');
        setAnime(animeData);
        sessionStorage.setItem('anime', JSON.stringify(animeData));
  
        const episodes = await window.electron.ipcRenderer.invoke('get-latest-episode');
        const titles = await window.electron.ipcRenderer.invoke('get-titles', "https://anime-sama.fr/catalogue/umamusume-pretty-derby/saison1hs/vostfr/");
        setLatestEpisodes(episodes || []);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Une erreur est survenue lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const handleFocus = () => fetchData();
  
    window.addEventListener('focus', handleFocus);
  
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
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
        </div>
      )}
      <WatchHistory />
      <div className='Space'></div><div className='Space'></div><div className='Space'></div>
      <LatestEpisodes episodes={latestEpisodes} />
      <div className='Space'></div>
    </div>
  );
};

export default HomePage;
