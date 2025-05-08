import React from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import logo_app from "../../../../resources/pictures/logo_app.png";
import logo_acceuil from "../../../../resources/pictures/logo_app_only.png";
import logo_catalogue from "../../../../resources/pictures/logo_catalog.svg";
import logo_telecharhgement from "../../../../resources/pictures/logo_download.png";
const menuItems = [
  { to: "/erebus-empire/home", imgSrc: logo_acceuil, alt: "Logo Accueil", text: "Accueil" },
  { to: "/erebus-empire/catalogue", imgSrc: logo_catalogue, alt: "Logo Catalogue", text: "Catalogue" },
  { to: "/erebus-empire/downloads", imgSrc: logo_telecharhgement, alt: "Logo Téléchargement", text: "Téléchargements" },
];

const MenuBar = () => {
  const location = useLocation(); 

  return (
    <div className='MenuBar-box'>
      <div className="logo">
        <img draggable="false" src={logo_app} alt="Logo"  />
      </div>
      {menuItems.map(({ to, imgSrc, alt, text }) => (
        <div key={to} className={`Onglet-box ${location.pathname === to ? 'Onglet-box-select' : ''}`}>
          <Link to={to}>
            <img draggable="false" src={imgSrc} alt={alt} />
            <p>{text}</p>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default MenuBar;
