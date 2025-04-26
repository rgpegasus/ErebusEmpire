import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import MenuBar from "./components/menu-bar";
import CatalogPage from './pages/CatalogPage';
import HomePage from './pages/HomePage';
import DownloadPage from './pages/DownloadPage';
import FavoritesPage from './pages/FavoritesPage';
import TopBar from './components/top-bar';
import SeasonsPage from './pages/SeasonPage';
import EpisodePage from './pages/EpisodePage.jsx';

const Logger = () => {
  const location = useLocation();
  // console.log("🧭 Chemin actuel :", location.pathname);
  return null;
};

const App = () => {
  useEffect(() => {
    window.electron.ipcRenderer.on('log-from-main', (_, msg) => {
      console.log('[FROM MAIN]', msg);
    });
  }, []);
  
  return (
    <Router>
      <Logger />
      <MenuBar />
      <div>
        <TopBar />
        <Routes>
          <Route path="/" element={<Navigate to="/erebus-empire/home" />} />
          <Route path="/erebus-empire/home" element={<HomePage/>} />
          <Route path="/erebus-empire/catalogue" element={<CatalogPage/>} />
          <Route path="/erebus-empire/downloads" element={<DownloadPage/>} />
          <Route path="/erebus-empire/favorites" element={<FavoritesPage/>} />
          <Route path="/erebus-empire/anime/:animeId/:seasonId?" element={<SeasonsPage/>} />
          <Route path="/erebus-empire/anime/:animeId/:seasonId/:episodeId" element={<EpisodePage/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
