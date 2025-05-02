import React, { useEffect, useState } from 'react';
import Loader from '../components/loader';
import { useNavigate } from 'react-router-dom';
import logo_recherche from "../../../../resources/pictures/logo_recherche.png";

const CatalogPage = () => {
  const [animeList, setAnimeList] = useState([]);
  const [results, setResults] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [page, setPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchAnime = async (p) => {
    setLoading(true);
    try {
      const [page1, page2, page3, next] = await Promise.all([
        window.electron.ipcRenderer.invoke("get-all-anime", p),
        window.electron.ipcRenderer.invoke("get-all-anime", p + 1),
        window.electron.ipcRenderer.invoke("get-all-anime", p + 2),
        window.electron.ipcRenderer.invoke("get-all-anime", p + 3)
      ]);

      const combined = [...(page1 || []), ...(page2 || []), ...(page3 || [])];
      setAnimeList(combined);
      setPage(p);
      setHasNext(next?.length > 0);

      const imagePromises = combined.map(anime => new Promise(resolve => {
        const img = new Image();
        img.src = anime.cover;
        img.onload = resolve;
        img.onerror = resolve;
      }));
      await Promise.all(imagePromises);

    } catch (e) {
      console.error("Erreur chargement :", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchResults = async (query, p) => {
    setLoading(true);
    try {
      const [res1, res2, res3, resNext] = await Promise.all([
        window.electron.ipcRenderer.invoke('search-anime', query, 9999999,  p),
        window.electron.ipcRenderer.invoke('search-anime', query, 9999999,  p + 1),
        window.electron.ipcRenderer.invoke('search-anime', query, 9999999,  p + 2),
        window.electron.ipcRenderer.invoke('search-anime', query, 9999999, p + 3),
      ]);
  
      const combined = [...(res1 || []), ...(res2 || []), ...(res3 || [])];
      setResults(combined);
      setSearchPage(p);
      setHasNext((resNext || []).length > 0);
  
      const imagePromises = combined.map(anime => new Promise(resolve => {
        const img = new Image();
        img.src = anime.cover;
        img.onload = resolve;
        img.onerror = resolve;
      }));
      await Promise.all(imagePromises);
  
    } catch (e) {
      console.error("Erreur recherche :", e);
    } finally {
      setLoading(false);
    }
  };
  

  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setSearchPage(1);
    if (newValue.trim() === "") {
      setResults([]);
    } else {
      fetchSearchResults(newValue, 1);
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

  const displayedList = results.length > 0 || inputValue.trim() !== "" ? results : animeList;

  const handlePrev = () => {
    if (inputValue.trim()) {
      fetchSearchResults(inputValue, searchPage - 1);
    } else {
      fetchAnime(page - 3);
    }
  };

  const handleNext = () => {
    if (inputValue.trim()) {
      fetchSearchResults(inputValue, searchPage + 1);
    } else {
      fetchAnime(page + 3);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className='MainPage'>
      <div className='Space'></div>
      <div className="CategorieTitle">Catalogue d'animé :</div>
      <div className="search-container">
        <img draggable="false" src={logo_recherche} alt="Logo Recherche" className='SearchLogo' />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="RECHERCHER..."
          className="search-bar"
        />
      </div>
      <div className='CatalogAll'>
        <div className="CatalogEpisodes">
          {displayedList.map((anime, i) => (
            <div key={anime.title || i} className="CatalogEpisodes-item">
              <div className="CatalogEpisodes-cover">
                <h3>{anime.title}</h3>
                <img src={anime.cover} alt={anime.title} draggable={false} className="EpisodeCover" />
                <div onClick={() => handleClick(anime)} className='CatalogEpisodes-button'>voir</div>
              </div>
            </div>
          ))}
        </div>

        {/* Affiche la pagination dans tous les cas */}
        <div className="pagination-buttons">
          <button onClick={handlePrev} disabled={(inputValue.trim() ? searchPage : page) <= 1}>Précédent</button>
          <button onClick={handleNext} disabled={!hasNext}>Suivant</button>
        </div>
      </div>
      <div className='Space'></div>
    </div>
  );
};

export default CatalogPage;
