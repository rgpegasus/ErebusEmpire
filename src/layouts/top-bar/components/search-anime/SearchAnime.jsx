import React, { useEffect, useState, useRef } from 'react';
import { SearchIcon } from '@utils/dispatchers/Icons'
import { useNavigate } from 'react-router-dom';
import ImgLoader from '@components/img-loader/ImgLoader';
import styles from './SearchAnime.module.css';

const SearchAnime = () => {
    
  const logoRef = useRef(null); 
const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const enterCooldown = useRef(false);
    const inputRef = useRef(null); 
    const [searchVisible, setSearchVisible] = useState(false); 
  const navigate = useNavigate();
  useEffect(() => {
  const handleClickOutside = (event) => {
    setTimeout(() => {
      const target = event.target;
      if (inputRef.current && !inputRef.current.contains(target) && logoRef.current && !logoRef.current.contains(target)) {
        logoRef.current.classList.remove('hide');
        setInputValue('');
        setResults([]);
        setSearchVisible(false);
      }
    }, 0);
  };

  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, []);
  useEffect(() => {
    if (searchVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchVisible]);
  
const handleKeyDown = (event) => {
    if (event.key === 'Enter' && results.length > 0 && !enterCooldown.current) {
      handleCardClick(results[0]); 
    }
  };
  const handleInputChange = async (event) => {
    const newValue = event.target.value;
    setInputValue(newValue);

    const data = await window.electron.ipcRenderer.invoke('search-anime', newValue, 5, null);
    setResults(data);
  };
  const getAnimeId = (url) => {
    try {
      const cleanUrl = new URL(url);
      const pathname = cleanUrl.pathname.replace(/\/$/, '');
      const parts = pathname.split('/').filter(Boolean);
      return parts[parts.length - 1];
    } catch (e) {
      console.error("URL invalide :", url);
      return "";
    }
  };
  const handleCardClick = (anime) => {
    enterCooldown.current = true;
    setTimeout(() => {
      enterCooldown.current = false;
    }, 300); // 300 ms de blocage du Enter

    setSearchVisible(false); 
    setInputValue(''); 
    setResults([]);
    navigate(`/erebus-empire/anime/${getAnimeId(anime.url)}/`);
  };
  const toggleSearch = () => {
    setSearchVisible(prev => {
      const newVisible = !prev;
      return newVisible;
    });
  };
return (
    <>
       <div className={styles.SearchContainer}>
          <div ref={logoRef} className={styles.LogoBox}>
            <SearchIcon className={`${styles.Logo} ${searchVisible ? styles.hide : ''}`} onClick={toggleSearch} />
          </div>
          {searchVisible && (
            <div>
              <input
                ref={inputRef} 
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="RECHERCHER..."
                className={styles.SearchBar}
              />
            </div>
          )}
        </div>
        {inputValue && (
          <div className={styles.ResultContainer}>
            {results?.map((anime) => (
              <div className={styles.Item} onClick={() => handleCardClick(anime)} style={{ cursor: 'pointer' }}>
                <div className={styles.Cover}>
                  <ImgLoader
                    key={anime.title + anime.cover}
                    anime={anime}
                  />
                </div>
                <div>
                  <h3 className={styles.AnimeTitle}>{anime.title}</h3>
                  <h4 className={styles.EpisodeTitle}>{anime.altTitles?.[0] || ''}</h4>
                </div>
              </div>
            ))}
          </div>
        )} 
    </>
  );
};

export default SearchAnime;
