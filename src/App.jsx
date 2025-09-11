import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import MenuBar from "@layouts/side-bar/SideBar";
import ToolBar from '@layouts/tool-bar/ToolBar';
import TopBar from '@layouts/top-bar/TopBar';
import { LoaderProvider, Catalog, Home, Download, Season, Episode, Settings, SwitchAccount, Favorites, Watchlist, History, OnHold, AlreadySeen, Profile } from '@utils/dispatchers/Page';
import { UserProvider } from '@context/user-context/UserContext';
import { NotFound } from '@utils/dispatchers/Page'
const Logger = () => {
  const location = useLocation();
  console.log("🧭 Chemin actuel :", location.pathname + location.search);
  return null;
};

const App = () => {
  useEffect(() => {
    window.electron.ipcRenderer.on('log-from-main', (_, msg) => {
      console.log('[FROM MAIN]', msg);
    });
  }, []);
  
  
  const getUsageTime = () => {
    const savedTime = localStorage.getItem('usageTime');
    return savedTime ? parseInt(savedTime, 10) : 0;
  };
  
  useEffect(() => {
    let usageTime = getUsageTime();
    const interval = setInterval(() => {
      usageTime += 1;
      localStorage.setItem('usageTime', usageTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [1000]);

  const DeepLinkHandler = () => {
    const navigate = useNavigate();

    useEffect(() => {
      if (window.deeplinkAPI) {
        window.deeplinkAPI.onDeepLink((url) => {
          const path = url.replace('erebusempire://', '');
          navigate(`/${path}`);
        });
      }
    }, [navigate]);

    return null; 
  };


  return (
    <UserProvider>
      <Router>
        <ToolBar />
        <LoaderProvider>
          {/* <LoginPage/> */}
          <Logger />
          <MenuBar />
          <DeepLinkHandler /> 
          <div>
            <TopBar /> 
            <Routes>
              <Route path="/" element={<Navigate to="/erebus-empire/home" />} />
              <Route path="/erebus-empire/home" element={<Home/>} />
              <Route path="/erebus-empire/catalogue" element={<Catalog/>} />
              <Route path="/erebus-empire/downloads" element={<Download/>} />
              <Route path="/erebus-empire/profile/settings" element={<Settings/>} />
              <Route path="/erebus-empire/profile" element={<Profile/>} />
              <Route path="/erebus-empire/profile/switchAccount" element={<SwitchAccount/>} />
              <Route path="/erebus-empire/profile/favorites" element={<Favorites/>} />
              <Route path="/erebus-empire/profile/watchlist" element={<Watchlist/>} />
              <Route path="/erebus-empire/profile/history" element={<History/>} />
              <Route path="/erebus-empire/profile/onHold" element={<OnHold/>} /> 
              <Route path="/erebus-empire/profile/alreadySeen" element={<AlreadySeen/>} />
              <Route path="/erebus-empire/anime/:animeId/:seasonId?" element={<Season/>} />
              <Route path="/erebus-empire/anime/:animeId/:seasonId/:episodeId" element={<Episode/>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </LoaderProvider> 
      </Router>
    </UserProvider> 
  );
}

export default App;
