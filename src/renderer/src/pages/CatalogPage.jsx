import React, { useEffect, useState } from 'react';
import Loader from '../components/loader';
import { useNavigate } from 'react-router-dom';

const CatalogPage = () => {
  const [animeList, setAnimeList] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchAnime = async (p) => {
    setLoading(true);
    try {
      const [current, next] = await Promise.all([
        window.electron.ipcRenderer.invoke("get-all-anime", p),
        window.electron.ipcRenderer.invoke("get-all-anime", p + 1)
      ]);
      setPage(p);
      setHasNext(next?.length > 0);
  
      const imagePromises = (current || []).map(anime =>
        new Promise(resolve => {
          const img = new Image();
          img.src = anime.cover;
          img.onload = resolve;
          img.onerror = resolve;
        })
      );
      await Promise.all(imagePromises);
  
      setAnimeList(current || []);
    } catch (e) {
      console.error("Erreur chargement :", e);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => { fetchAnime(1); }, []);

  const getAnimeId = (url) => {
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      return parts.pop();
    } catch {
      return "";
    }
  };

  const handleClick = (anime) => {
    navigate(`/erebus-empire/anime/${getAnimeId(anime.url)}/`);
  };

  if (loading) return <Loader />;

  return (
    <div className='MainPage'>
      <div className='Space'></div>
      <div className="CategorieTitle">Catalogue d'animé :</div>
      <div className='CatalogAll'>
        <div className="CatalogEpisodes">
          {animeList.map((anime, i) => (
            <div key={anime.title || i} className="CatalogEpisodes-item" onClick={() => handleClick(anime)}>
              <div className="CatalogEpisodes-cover">
                <h3>{anime.title}</h3>
                <img src={anime.cover} alt={anime.title} draggable={false} className="EpisodeCover" />
                <div className='CatalogEpisodes-button'>voir</div>
              </div>
            </div>
          ))}
        </div>
        <div className="pagination-buttons">
          <button onClick={() => fetchAnime(page - 1)} disabled={page === 1}>Précédent</button>
          <button onClick={() => fetchAnime(page + 1)} disabled={!hasNext}>Suivant</button>
        </div>
      </div>
      <div className='Space'></div>
    </div>
  );
};

export default CatalogPage;
