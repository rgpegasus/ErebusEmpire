import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import ToolBar from '@layouts/tool-bar/ToolBar';
import TopBar from '@layouts/top-bar/TopBar';
import Theme from '@layouts/theme/Theme'
import { LoaderProvider, Catalog, Home, Download, Season, Dispatcher, Settings, SwitchAccount, Favorites, Watchlist, History, OnHold, AlreadySeen, Profile, NotFound } from '@utils/dispatchers/Page';
import { UserProvider } from '@context/user-context/UserContext';

const Logger = () => {
  const location = useLocation();
  console.log("🧭 Chemin actuel :", location.pathname + location.search);
  return null;
};

const App = () => {
  const [showTheme, setShowTheme] = React.useState(false); 
  const openTheme = () => setShowTheme(true);
  const closeTheme = () => setShowTheme(false);

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
    <LoaderProvider>
      <UserProvider>
        <Router>
          <ToolBar />
          {/* <LoginPage/> */}
          <Logger />
          <Theme visible={showTheme} onClose={closeTheme} />
          <DeepLinkHandler />
          <div>
            <TopBar />
            <Routes>
              <Route path="/" element={<Navigate to="/erebus-empire/home" replace />} />
              <Route path="/erebus-empire/home" element={<Home />} />
              <Route path="/erebus-empire/catalog" element={<Catalog />} />
              <Route path="/erebus-empire/downloads" element={<Download />} />
              <Route path="/erebus-empire/:animeId/:seasonId?" element={<Season />} />
              <Route path="/erebus-empire/:animeId/:seasonId/:episodeId" element={<Dispatcher />} />
              <Route path="/erebus-empire/settings" element={<Settings openTheme={openTheme} />} />
              <Route path="/erebus-empire/settings/profile" element={<Profile />} />
              <Route path="/erebus-empire/switchAccount" element={<SwitchAccount />} />
              <Route path="/erebus-empire/favorites" element={<Favorites />} />
              <Route path="/erebus-empire/watchlist" element={<Watchlist />} />
              <Route path="/erebus-empire/history" element={<History />} />
              <Route path="/erebus-empire/onHold" element={<OnHold />} />
              <Route path="/erebus-empire/alreadySeen" element={<AlreadySeen />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </UserProvider>
    </LoaderProvider>
  )
}

export default App;
