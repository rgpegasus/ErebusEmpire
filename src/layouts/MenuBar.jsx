import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { DarkErebusIcon, LightErebusIcon, ErebusIcon, CatalogIcon, DownloadIcon } from '@utils/PictureDispatcher';

const menuItems = [
  { to: "/erebus-empire/home", imgSrc: ErebusIcon, alt: "Logo Accueil", text: "Accueil" },
  { to: "/erebus-empire/catalogue", imgSrc: CatalogIcon, alt: "Logo Catalogue", text: "Catalogue" },
  { to: "/erebus-empire/downloads", imgSrc: DownloadIcon, alt: "Logo Téléchargement", text: "Téléchargements" },
];

const MenuBar = () => {
  const location = useLocation(); 
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = localStorage.getItem('theme') || 'dark';
      setTheme(newTheme);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const logo_app = theme === 'dark' ? DarkErebusIcon : LightErebusIcon;

  return (
    <div className='MenuBar-box'>
      <div className="logo">
        <img draggable="false" src={logo_app} alt="Logo" />
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
