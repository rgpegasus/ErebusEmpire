import React, { useState, useEffect, useRef } from 'react';
import AnimeCardWithLoader from './AnimeCardWithLoader';
import { useNavigate } from 'react-router-dom';
import UtilityTopBar from '@layouts/components/UtilityTopBar';
import { ErebusIcon } from '@utils/PictureDispatcher';
import { getRealEpisodeName } from '@utils/getRealEpisodeName'
import { useLoader } from '@utils/PageDispatcher';
import { MdNotifications } from "react-icons/md";
import { TbSearch } from "react-icons/tb";

function TopBar() {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const enterCooldown = useRef(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchVisible, setSearchVisible] = useState(false); 
  const [notifVisible, setNotifVisible] = useState(false);
  const [searchImagesLoaded, setSearchImagesLoaded] = useState(0);
  const [searchImagesTotal, setSearchImagesTotal] = useState(0);

  const [notifiedEpisodes, setNotifiedEpisodes] = useState([]);
  const notifVisibleRef = useRef(notifVisible);
  const { setLoading } = useLoader();
  const navigate = useNavigate();
  const menuRef = useRef(null); 
  const inputRef = useRef(null); 
  const logoRef = useRef(null); 
  const notifiedEpisodesRef = useRef(null);
  const toggleWidth = 1920;
  useEffect(() => {
    notifVisibleRef.current = notifVisible;
  }, [notifVisible]);

  useEffect(() => {
  const handleClickOutside = (event) => {
    setTimeout(() => {
      const target = event.target;

      // Menu responsive
      if (windowWidth <= toggleWidth && menuRef.current && !menuRef.current.contains(target)) {
        const body = document.body;
        body.classList.remove('menu-extended');
        body.classList.add('menu-compact');
      }

      // Search
      if (inputRef.current && !inputRef.current.contains(target) && logoRef.current && !logoRef.current.contains(target)) {
        logoRef.current.classList.remove('hide');
        setInputValue('');
        setResults([]);
        setSearchVisible(false);
      }

      // Notifications
      if (
        notifVisibleRef.current && 
        notifiedEpisodesRef.current &&
        !notifiedEpisodesRef.current.contains(target) &&
        !event.target.closest('.NotifiedEpisodes-logo')
      ) {
        setNotifVisible(false);
      }
    }, 0);
  };

  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, [windowWidth]);

  
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      const body = document.body;

      if (newWidth <= toggleWidth) {
        body.classList.remove('menu-extended');
        body.classList.add('menu-compact');
      } else {
        body.classList.remove('menu-compact');
        body.classList.remove('menu-extended');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => {
    if (windowWidth > toggleWidth) return;
    const body = document.body;
    body.classList.toggle('menu-compact');
    body.classList.toggle('menu-extended');
  }
  const loadNotifiedEpisodes = async () => {
    const all = await animeData.loadAll("notifiedEpisodes");
    if (!all) return;
    const episodes = Array.isArray(all) ? all : Object.values(all);
    episodes.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    setNotifiedEpisodes(episodes);
  };

  const handleInputChange = async (event) => {
    const newValue = event.target.value;
    setInputValue(newValue);

    const data = await window.electron.ipcRenderer.invoke('search-anime', newValue, 5, null);

    setSearchImagesLoaded(0);
    setSearchImagesTotal(data.length);
    setResults(data);
  };
const handleSearchImageLoad = () => {
  setSearchImagesLoaded(prev => prev + 1);
};

  const toggleNotifiedEpisodes = () => {
    if (!notifVisible) {
      loadNotifiedEpisodes(); 
    }
    setNotifVisible(prev => {
      const newVisible = !prev;
      return newVisible;
    });
  }
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
  const handleEpisodeClick = async (episode) => {
    try {
      setLoading(true)
      const { path, matchedEmbed, embedData, animeId, seasonId, seasonTitle } = await getRealEpisodeName(episode);
      console.log(path, matchedEmbed, embedData, animeId, seasonId, seasonTitle, "caca")
      const episodes = {[episode.language]: embedData};
      if (path) {
        navigate(path, {
          state: {
            episodeTitle: matchedEmbed.title,
            episodes: episodes,
            animeId,
            seasonId,
            animeTitle: episode.title,
            seasonTitle,
            animeCover:episode.cover,
            seasonUrl:episode.url,
            availableLanguages:[episode.language],
            selectedLanguage:episode.language
          },
        });
      }
      setLoading(false)
    } catch (err) {
      console.error("Erreur lors de la navigation :", err);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && results.length > 0 && !enterCooldown.current) {
      handleCardClick(results[0]); 
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
  

  
  useEffect(() => {
    if (searchVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchVisible]);
  
  return (
    <div className='TopBar-box' ref={menuRef}> 
      {windowWidth <= toggleWidth && (
        <img onClick={toggleMenu} draggable="false" src={ErebusIcon} alt="Logo Erebus Empire" className='AppLogo' />
      )}
      <div className='TopBar-Categorie'>
        <MdNotifications
        className='NotifiedEpisodes-logo'
        onClick={toggleNotifiedEpisodes}
      />
        {notifVisible && (
          <div className='NotifiedEpisodes-list' ref={notifiedEpisodesRef}>
            {notifiedEpisodes?.length > 0 ? (
              <div>
                {notifiedEpisodes.map((episode) => (
                  <div key={episode.title} className="anime-card" onClick={() => handleEpisodeClick(episode)}>
                    {episode.cover ? (
                      <img draggable="false" src={episode.cover} alt={`Bannière de ${episode.title}`} className="cover-img" />
                    ) : (
                      <img draggable="false" src={ErebusIcon} alt={"Aucune cover"} className="cover-img" />
                    )}
                    <div>
                      <h3>{episode?.title}</h3>
                      <h4>{`${episode.language?.toUpperCase()} - ${episode.episode}`}</h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='AFK'>Aucun épisode sorti</div>
            )}
          </div>
        )}
        <div className="search-container">
          <div ref={logoRef}>
            <TbSearch className={`SearchLogo ${searchVisible ? 'hide' : ''}`} onClick={toggleSearch} />
          </div>
          {searchVisible && (
            <div className="search-bar-container">
              <input
                ref={inputRef} 
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="RECHERCHER..."
                className="search-bar"
              />
            </div>
          )}
        </div>
        {inputValue && (
          <div className="results-container">
            {results?.map((anime) => (
              <AnimeCardWithLoader
                key={anime.title + anime.cover}
                anime={anime}
                onClick={() => handleCardClick(anime)}
              />
            ))}
          </div>
        )}
       <UtilityTopBar/>
      </div>
    </div>  
  );
}

export default TopBar;
