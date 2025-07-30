import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, ChevronRight, Rocket, BatteryLow, Bell, LucideBellOff } from 'lucide-react';
import { FaUserCircle } from "react-icons/fa";

  const getUsageTime = () => {
    const savedTime = localStorage.getItem('usageTime');
    return savedTime ? parseInt(savedTime, 10) : 0;
  }; 
  
  const convertSecondsToTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secondsLeft = seconds % 60;
    return `${hours}h ${minutes}m ${secondsLeft}s`;
  };

export const Settings = () => {
  const [usageTime, setUsageTimeState] = useState(getUsageTime());
  const [croppedImage, setCroppedImage] = useState(null);
  const [username, setUsername] = useState("User");
  const navigate = useNavigate();
 
  useEffect(() => {
    const interval = setInterval(() => {
      setUsageTimeState(getUsageTime());
    }, 1000); 
    return () => clearInterval(interval);
  }, []);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light'; // Par défaut: dark
  });
  const [isPerf, setIsPerf] = useState(() => {
    return localStorage.getItem('perf') !== 'full'; // Par défaut: dark
  });
  const [isNotif, setIsNotif] = useState(() => {
    return localStorage.getItem('notif') !== 'off'; // Par défaut: dark
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  useEffect(() => {
    localStorage.setItem('perf', isPerf ? 'full' : 'eco');
  }, [isPerf]);
  useEffect(() => {
    localStorage.setItem('notif', isNotif ? 'off' : 'on');
  }, [isNotif]);
  useEffect(() => {
    const updateProfile = () => {
      const savedImage = localStorage.getItem('croppedProfileImage');
      const savedName = localStorage.getItem('username');
      if (savedImage) setCroppedImage(savedImage);
      if (savedName?.trim()) setUsername(savedName.trim());
    };

    window.addEventListener('profileUpdated', updateProfile);
    updateProfile(); // Appel initial

    return () => window.removeEventListener('profileUpdated', updateProfile);
  }, []); 

 
  const toggleTheme = () => setIsDark(prev => !prev);
  const togglePerf = () => setIsPerf(prev => !prev);
  const toggleNotif = () => setIsNotif(prev => !prev);


  return (
    <div className="MainPage">
      <div className='Space'></div>
      <h1 className="CategorieTitle">Paramètres</h1>          
      <div className='SettingsPage'>
        <div className='SettingsGroupe' onClick={() =>navigate("/erebus-empire/profile/")}>
          <div className='setting-item profil'>
            <div className='Settings-InfoUser'>
              {croppedImage? (
                <img src={croppedImage} alt="Profil" className="Settings-profile-img" draggable="false" />
              ):(
                <FaUserCircle className='Settings-profile-img'/>
              )}
              <div className="Settings-username">{username}</div>
            </div>
            <div className="Settings-usage-time">
              <span>Temps d'utilisation : {convertSecondsToTime(usageTime)}</span>
            </div>
            <span className="Settings-ChevronIcon"><ChevronRight size={30} /></span>
          </div>
        </div>
        <div className='Space'></div>
        <div className='SettingsGroupe'>
          <div className="setting-item">
            <span className="setting-label">Mode sombre</span>
            <label className="switch">
              <input type="checkbox" checked={isDark} onChange={toggleTheme} />
              <span className="slider">
                <span className="icon">{isDark ? <Moon size={14} /> : <Sun size={14} />}</span>
              </span>
            </label>
          </div>
          {/* <div className="setting-item">
            <span className="setting-label">Mode performance</span>
            <label className="switch">
              <input type="checkbox" checked={isPerf} onChange={togglePerf} />
              <span className="slider">
                <span className="icon">{isPerf ? <Rocket size={14} /> : <BatteryLow size={14} />}</span>
              </span>
            </label>
          </div> */}
          {/* <div className="setting-item">
            <span className="setting-label">Notifications</span>
            <label className="switch">
              <input type="checkbox" checked={isNotif} onChange={toggleNotif} />
              <span className="slider">
                <span className="icon">{isNotif ? <Bell size={14} /> : <LucideBellOff size={14} />}</span>
              </span>
            </label>
          </div> */}
          {/* <div className="setting-item">
            <span className="setting-label">Langue d'affichage</span>
          </div> */}
        </div>
      </div>
      <div className='Space'></div>
    </div>
  );
};

