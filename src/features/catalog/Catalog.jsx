import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLoader } from '@utils/dispatchers/Page';
import styles from './Catalog.module.css';
import {LoginPageBackground} from "@utils/dispatchers/Pictures"
import BackgroundCover from "@components/background-cover/BackgroundCover"
import ContentsCarousel from '@components/contents-carousel/ContentsCarousel';
export const Catalog = () => {
  const [animeList, setAnimeList] = useState([]);
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
      setAnimeList(firstThreePages);
      setHasNext((results[1] || []).length > 0);
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    <div className="MainPage">
      <BackgroundCover coverInfo={LoginPageBackground} whileWatching={false} isAnime={false} />
      <div className={styles.Container}>
        <ContentsCarousel
          data={animeList}
          title={"Catalogue"}
          onClickEpisode={(anime) => navigate(`/erebus-empire/${getAnimeId(anime.url)}/`)}
          getEpisodeCover={(anime) => anime.cover}
          getAnimeTitle={(anime) => anime.title}
          enableShiftDelete={true}
          isSeason={true}
          searchBy={setSearchParams}
          onDeleteEpisode={(anime) => deleteAnime(anime)}
          customType={`~~Page ${page}`}
        />
        <div className={styles.NavigationContainer}>
          <button
            className={styles.NavigationButton}
            onClick={() => handlePageChange(-1)}
            disabled={page <= 1}
          >
            Précédent
          </button>
          <button
            className={styles.NavigationButton}
            onClick={() => handlePageChange(1)}
            disabled={!hasNext}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  )
};
