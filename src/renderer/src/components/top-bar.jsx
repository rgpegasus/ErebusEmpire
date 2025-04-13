import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import logo_recherche from "../assets/pictures/logo_recherche.png";
import logo_app from "../assets/pictures/logo_app_only.png";

function TopBar() {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate(); 

  const handleInputChange = async (event) => {
    const newValue = event.target.value;
    setInputValue(newValue);

    const data = await window.electron.ipcRenderer.invoke('search-anime', newValue);
    setResults(data); 
  };

  const handleCardClick = (anime) => {
    setInputValue('');
    navigate(`/seasons/${encodeURIComponent(anime.url)}`);
  };
  
  return (
    <div className='TopBar-box'>
      <img draggable="false" src={logo_app} alt="Logo Erebus Empire" className='AppLogo' />
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
      {inputValue && (
        <div className="results-container">
          {results.map((anime, index) => (
            <div
              key={index}
              className="anime-card"
              onClick={() => handleCardClick(anime)}
              style={{ cursor: "pointer" }}
            >
              {anime.cover ? (
                <img 
                  draggable="false"
                  src={anime.cover} 
                  alt={`Bannière de ${anime.title}`} 
                  className="cover-img"
                />
              ) : (
                <p>Aucune image disponible</p>
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
