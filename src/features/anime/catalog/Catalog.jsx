import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLoader } from '@utils/dispatchers/Page';
import { SearchIcon } from '@utils/dispatchers/Icons';
import ImgLoader from '@components/img-loader/ImgLoader';
import styles from './Catalog.module.css';

export const Catalog = () => {
  const [listAnime, setListAnime] = useState([]);
  const [input, setInput] = useState('');
  const [hasNext, setHasNext] = useState(true);

  const { setLoading } = useLoader();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const query = searchParams.get('q') || '';

  const fetchData = async (startPage, searchQuery = '') => {
    setLoading(true);

    try {
      const isSearching = searchQuery.trim() !== '';
      const functionName = isSearching ? 'search-anime' : 'get-all-anime';
      const functionArgs = isSearching ? [searchQuery, 9999999] : [];

      const pageNumbers = [0, 1];
      const results = await Promise.all(
        pageNumbers.map(offset =>
          window.electron.ipcRenderer.invoke(functionName, ...functionArgs, startPage + offset)
        )
      );

      const firstThreePages = results.slice(0, 1).flat().filter(Boolean);
      setListAnime(firstThreePages);
      setHasNext((results[1] || []).length > 0);
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setInput(query);
    fetchData(page, query);
    document.querySelector('.MainPage')?.scrollTo({ top: 0, behavior: 'instant' });
  }, [page, query]);

  const getAnimeId = (url) => {
    try {
      return new URL(url).pathname.split('/').filter(Boolean).pop() || '';
    } catch {
      return '';
    }
  };

  const handleSearch = () => {
    const trimmed = input.trim();
    setSearchParams({ page: '1', ...(trimmed && { q: trimmed }) });
  };

  const handleClear = () => {
    setInput('');
    setSearchParams({ page: '1' });
  };

  const handlePageChange = (delta) => {
    const newPage = page + delta;
    if (newPage < 1) return;

    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('page', newPage);
      if (query.trim()) params.set('q', query);
      else params.delete('q');
      return params;
    });
  };

  return (
    <div className='MainPage'>
      <div className='Space'></div>
      <div className="CategorieTitle">Catalogue d'animé :</div>
      <div className={styles.CatalogContainer}> 
        <div className={styles.SearchContainer}>
          <SearchIcon className={styles.SearchIcon} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="RECHERCHER..."
            className={styles.SearchBar}
          />
          {input.trim() !== '' && (
            <span className={styles.ClearSearchIcon} onClick={handleClear}>✖</span>
          )}
        </div>

        <div className='Space'></div>
        {listAnime.length > 0 ? (
          <div className={styles.ResultsContainer}>
            {listAnime.map((anime, i) => (
              <div key={anime.title || i} className={styles.ItemContainer}>
                <div className={styles.CoverContainer}>
                  <h3 className={styles.Title}>{anime.title}</h3>
                  <div className={styles.Img}>
                    <ImgLoader
                      key={anime.title + anime.cover}
                      anime={anime}
                    />
                  </div>
                  <div
                    onClick={() => navigate(`/erebus-empire/anime/${getAnimeId(anime.url)}/`)}
                    className={styles.SeeButton}
                  >
                    voir
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.ResultNone}>
           <p className={styles.ResultNoneMessage}>Aucun animé disponible</p>
          </div>
        )}

        <div className={styles.NavigationContainer}>
          <button className={styles.NavigationButton} onClick={() => handlePageChange(-1)} disabled={page <= 1}>Précédent</button>
          <button className={styles.NavigationButton} onClick={() => handlePageChange(1)} disabled={!hasNext}>Suivant</button>
        </div>
      </div>
      <div className='Space'></div>
    </div>
  );
};
