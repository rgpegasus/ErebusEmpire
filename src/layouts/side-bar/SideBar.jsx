import React from 'react';
import { CatalogIcon, DownloadIcon, ErebusIcon } from '@utils/dispatchers/Icons';
import LogoErebus from './components/logo-erebus/LogoErebus';
import Navigation from './components/navigation/Navigation';

const SideBar = () => {
  return (
    <div className="SideBar">
      {/* Logo principal */}
      <LogoErebus />

      {/* Liens du menu */}
      <Navigation
        to="/erebus-empire/home"
        icon={<ErebusIcon />}
        label="Accueil"
      />
      {/* Lien du catalogue */}
      <Navigation
        to="/erebus-empire/catalogue"
        icon={<CatalogIcon />}
        label="Catalogue"
      />
      {/* Lien des téléchargements */}
      <Navigation
        to="/erebus-empire/downloads"
        icon={<DownloadIcon />}
        label="Téléchargements"
      />
    </div>
  );
};

export default SideBar;
