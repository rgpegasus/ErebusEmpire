import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo_recherche from "../../../../resources/pictures/logo_recherche.png";
import logo_app from "../../../../resources/pictures/logo_app_only.png";

function TopBar() {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  const menuRef = useRef(null); 
  const toogleWidth = 1200
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (windowWidth <= toogleWidth && menuRef.current && !menuRef.current.contains(event.target)) {
        const body = document.body;
        body.classList.remove('menu-extended');
        body.classList.add('menu-compact');
      }
      
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setInputValue(''); 
        setResults([]);   
      }
    };
    

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [windowWidth]);  

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      const body = document.body;

      if (newWidth <= toogleWidth) {
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

  function toggleMenu() {
    if (windowWidth > toogleWidth) return;
    const body = document.body;
    body.classList.toggle('menu-compact');
    body.classList.toggle('menu-extended');
  }

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
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && results.length > 0) {
      handleCardClick(results[0]); 
    }
  };

   

  const handleCardClick = (anime) => {
    setInputValue('');
    navigate(`/erebus-empire/anime/${getAnimeId(anime.url)}/`);
  };

  return (
    <div className='TopBar-box' ref={menuRef}> 
      {windowWidth < toogleWidth && (
        <img onClick={toggleMenu} draggable="false" src={logo_app} alt="Logo Erebus Empire" className='AppLogo' />
      )}

      <div className="search-container">
        <img draggable="false" src={logo_recherche} alt="Logo Recherche" className='SearchLogo' />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="RECHERCHER..."
          className="search-bar"
        />    
      </div>

      {inputValue && (
        <div className="results-container">
          {results.map((anime, index) => (
            <div key={index} className="anime-card" onClick={() => handleCardClick(anime)} style={{ cursor: "pointer" }}>
              {anime.cover ? (
                <img draggable="false" src={anime.cover} alt={`Bannière de ${anime.title}`} className="cover-img" />
              ) : (
                <p>Image indisponible</p>
              )}
              <div>
                <h3>{anime.title}</h3>
                <h4>{anime.altTitles[0]}</h4>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TopBar;
