import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoader } from '@utils/PageDispatcher';
import { ResearchIcon } from '@utils/PictureDispatcher';

export const Catalog = () => {
  const [list, setList] = useState([]);
  const [input, setInput] = useState('');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const { setLoading } = useLoader();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const isSearch = query.trim() !== '';

  const preloadImages = async (items) => {
    await Promise.all(items.map(anime => new Promise(resolve => {
      const img = new Image();
      img.src = anime.cover;
      img.onload = img.onerror = resolve;
    })));
  };

 const fetchData = async (startPage, searchQuery = '') => {
  setLoading(true);

  try {
    const isSearching = searchQuery.trim() !== '';
    const functionName = isSearching ? 'search-anime' : 'get-all-anime';
    const functionArgs = isSearching ? [searchQuery, 9999999] : [];

    const pageNumbers = [0, 1, 2];
    const results = await Promise.all(
      pageNumbers.map(offset => 
        window.electron.ipcRenderer.invoke(functionName, ...functionArgs, startPage + offset)
      )
    );

    const firstThreePages = results.slice(0, 2).flat().filter(Boolean); 
    const fourthPage = 

    setList(firstThreePages);
    setPage(startPage);
    setHasNext((fourthPage || []).length > 0);

    // Précharger les images pour éviter les flashs
    await preloadImages(firstThreePages);
    
  } catch (error) {
    console.error("Erreur lors du chargement des données :", error);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (input.trim() === '') {
      setQuery('');
      fetchData(1);
    }
  }, [input]);

  useEffect(() => {
    if (isSearch) fetchData(1, query);
  }, [query]);

  const getAnimeId = (url) => {
    try {
      return new URL(url).pathname.split('/').filter(Boolean).pop() || '';
    } catch {
      return '';
    }
  };

  const handleSearch = () => {
    const trimmed = input.trim();
    if (trimmed === '') {
      setQuery('');
      fetchData(1);
    } else {
      setQuery(trimmed);
      fetchData(1, trimmed);
    }
  };

  const handleClear = () => {
    if (input.trim() === '' && !isSearch && page === 1) return;
    setInput('');
    setQuery('');
    fetchData(1);
  };

  const handlePageChange = (delta) => {
    const newPage = page + delta;
    if (newPage < 1) return;
    fetchData(newPage, isSearch ? query : '');
  };

  return (
    <div className='MainPage'>
      <div className='Space'></div> 
      <div className="CategorieTitle">Catalogue d'animé :</div>
      <div className='CatalogAll'>
        <div className="CatalogEpisode-search-container">
          <img draggable="false" src={ResearchIcon} alt="Recherche" className='CatalogEpisode-SearchLogo' />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="RECHERCHER..."
            className="CatalogEpisode-search-bar"
          />
          {input.trim() !== '' && (
            <span className="clear-search" onClick={handleClear}>✖</span>
          )}
        </div>

        <div className='Space'></div>
        <div className="CatalogEpisodes">
          {list.map((anime, i) => (
            <div key={anime.title || i} className="CatalogEpisodes-item">
              <div className="CatalogEpisodes-cover">
                <h3>{anime.title}</h3>
                <img src={anime.cover} alt={anime.title} draggable={false} className="EpisodeCover" />
                <div onClick={() => navigate(`/erebus-empire/anime/${getAnimeId(anime.url)}/`)} className='CatalogEpisodes-button'>voir</div>
              </div>
            </div>
          ))}
        </div>

        <div className="pagination-buttons">
          <button onClick={() => handlePageChange(-3)} disabled={page <= 1}>Précédent</button>
          <button onClick={() => handlePageChange(3)} disabled={!hasNext}>Suivant</button>
        </div>
      </div>
      <div className='Space'></div>
    </div>
  );
};

