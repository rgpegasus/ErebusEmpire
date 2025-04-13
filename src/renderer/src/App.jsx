import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom'; // Importer Routes et Route
import MenuBar from "./components/menu-bar";
import CatalogPage from './pages/CatalogPage';
import HomePage from './pages/HomePage';
import DownloadPage from './pages/DownloadPage';
import FavoritesPage from './pages/FavoritesPage';
import TopBar from './components/top-bar';
import SeasonsPage from './pages/SeasonPage';
import EpisodePage from './pages/EpisodePage.jsx';

const App = () => {
  return (
    <Router>
      <MenuBar/>
      <div>
        <TopBar/>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogue" element={<CatalogPage />} />
          <Route path="/downloads" element={<DownloadPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/seasons/:animeId" element = {<SeasonsPage/>} />
          <Route path="/episode/:episodeId" element={<EpisodePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
