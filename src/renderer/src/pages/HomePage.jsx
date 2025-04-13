import React, { useEffect, useState } from 'react';
import Loader from '../components/loader'; 

const HomePage = () => {
  const [anime, setAnime] = useState(null);
  const [latestEpisodes, setLatestEpisodes] = useState([]);  // State pour stocker les derniers épisodes
  const [loading, setLoading] = useState(true);  // Etat pour gérer le chargement

  useEffect(() => {
    const fetchAnime = async () => {
      setLoading(true); // Début du chargement
      try {
        const storedAnime = sessionStorage.getItem('anime');
        if (storedAnime) {
          setAnime(JSON.parse(storedAnime));  // Si les données sont en sessionStorage
        } else {
          const fetchedAnime = await window.electron.ipcRenderer.invoke('random-anime'); // Appel IPC pour récupérer un anime
          setAnime(fetchedAnime);
          sessionStorage.setItem('anime', JSON.stringify(fetchedAnime));  // Sauvegarde dans sessionStorage
        }
      } catch (err) {
        console.error("Erreur lors du chargement de l'anime :", err);
      } 
    };
  
    const fetchLatestEpisodes = async () => {
      try {
        const episodes = await window.electron.ipcRenderer.invoke('get-latest-episode');  // Appel IPC pour récupérer les derniers épisodes
        console.log('Derniers épisodes:', episodes);  // Affiche les épisodes dans la console
        setLatestEpisodes(episodes || []);  // Si les épisodes sont récupérés, les stocker dans le state
      } catch (err) {
        console.error("Erreur lors de la récupération des derniers épisodes :", err);
      }finally {
        setLoading(false); // Fin du chargement
      }
    };
  
    fetchAnime();  // Charger les données de l'anime
    fetchLatestEpisodes();  // Charger les derniers épisodes
  }, []);  // Exécuté une seule fois lors du montage du composant
  
  return (
    <div className='MainPage'>
      {loading ? (
        <Loader />  // Afficher un loader pendant le chargement
      ) : (
        <>
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

          <div className="CategorieTitleHome">Derniers épisodes sorties :</div>
          {latestEpisodes.length > 0 ? (
            <div className="LatestEpisodes">
              {latestEpisodes.map((episode, index) => (
                <div key={index} className="LatestEpisodes-item">
                  <div className="LatestEpisodes-cover">
                  <h3>{episode.title}</h3>
                    <img src={episode.cover} draggable="false" alt={episode.title} className="EpisodeCover" />
                  </div>
                  <div className='LatestEpisodes-info'>
                    <h1>{episode.episode}</h1>
                    <div></div>
                    <p>{episode.language}</p>
                  </div>
                  
                </div>
              ))}
            </div> 
          ) : (
            <p>Aucun épisode disponible</p>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
