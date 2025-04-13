import React from 'react';
import "../assets/styles/main.css";
import { Link, useLocation } from 'react-router-dom'; 
import logo_app from "../assets/pictures/logo_app.png";
import logo_acceuil from "../assets/pictures/logo_app_only.png";
import logo_catalogue from "../assets/pictures/logo_catalog.svg";
import logo_telecharhgement from "../assets/pictures/logo_download.png";
import logo_favoris from "../assets/pictures/logo_favoris.png";

const MenuBar = () => {
  const location = useLocation(); 

  return (
    <div className='MenuBar-box'>
      <img draggable="false" src={logo_app} alt="Logo" className="logo" />
      <div className={`Onglet-box ${location.pathname === '/' ? 'Onglet-box-select' : ''}`}>
        <Link to="/">
          <img draggable="false" src={logo_acceuil} alt="Logo Accueil" />
          <p>Accueil</p>
        </Link>
      </div>

      <div className={`Onglet-box ${location.pathname === '/catalogue' ? 'Onglet-box-select' : ''}`}>
        <Link to="/catalogue">
          <img draggable="false" src={logo_catalogue} alt="Logo Catalogue" />
          <p>Catalogue</p>
        </Link>
      </div>

      <div className={`Onglet-box ${location.pathname === '/downloads' ? 'Onglet-box-select' : ''}`}>
        <Link to="/downloads">
          <img draggable="false" src={logo_telecharhgement} alt="Logo Téléchargement" />
          <p>Téléchargements</p>
        </Link>
      </div>

      <div className={`Onglet-box ${location.pathname === '/favorites' ? 'Onglet-box-select' : ''}`}>
        <Link to="/favorites">
          <img draggable="false" src={logo_favoris} alt="Logo Favoris" />
          <p>Favoris</p>
        </Link>
      </div>
    </div>
  );
};

export default MenuBar;
