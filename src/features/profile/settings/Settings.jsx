import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '@context/user-context/UserContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Rocket, BatteryLow, Bell, LucideBellOff } from 'lucide-react';
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

export const Settings = ({ openTheme }) => {
  const { username, profileImage } = useContext(UserContext);
  const [usageTime, setUsageTimeState] = useState(getUsageTime());
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setUsageTimeState(getUsageTime());
    }, 1000); 
    return () => clearInterval(interval);
  }, []);

  const [isPerf, setIsPerf] = useState(() => {
    return localStorage.getItem('perf') !== 'full';
  });
  const [isNotif, setIsNotif] = useState(() => {
    return localStorage.getItem('notif') !== 'off';
  });

  useEffect(() => {
    localStorage.setItem('perf', isPerf ? 'full' : 'eco');
  }, [isPerf]);
  useEffect(() => {
  localStorage.setItem('notif', isNotif ? 'on' : 'off');
    window.dispatchEvent(new Event('notifChanged'));
  }, [isNotif]);
  
  
  const togglePerf = () => setIsPerf(prev => !prev);
  const toggleNotif = () => setIsNotif(prev => !prev);

  return (
    <div className="MainPage">
      <div className='Space'></div>
      <h1 className="CategorieTitle">Paramètres</h1>          
      <div className='SettingsPage'>
        <div className='SettingsGroupe'>
          <div className='setting-item profil' onClick={() =>navigate("/erebus-empire/settings/profile")}>
            <div className='Settings-InfoUser'>
              {profileImage? (
                <img src={profileImage} alt="Profil" className="Settings-profile-img" draggable="false" />
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
          <div className='setting-item theme' onClick={openTheme}>
            <span className="setting-label">Personnaliser le thème</span>
            <span className="Settings-ChevronIcon"><ChevronRight size={30} /></span>
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
          <div className="setting-item">
            <span className="setting-label">Notifications</span>
            <label className="switch">
              <input type="checkbox" checked={isNotif} onChange={toggleNotif} />
              <span className="slider">
                <span className="icon">{isNotif ? <Bell size={14} /> : <LucideBellOff size={14} />}</span>
              </span>
            </label>
          </div>
          {/* <div className="setting-item">
            <span className="setting-label">Langue d'affichage</span>
          </div> */}
        </div>
      </div>
      <div className='Space'></div>
    </div>
  );
};
