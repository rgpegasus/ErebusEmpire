import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const SettingsPage = () => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light'; // Par défaut: dark
  });
  

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <div className="MainPage">
      <div className='Space'></div>
      <h1 className="CategorieTitle">Paramètres</h1>
      <div className='SettingsPage'>
      <div className="setting-item">
        <span className="setting-label">Mode sombre</span>
        <label className="switch">
          <input type="checkbox" checked={isDark} onChange={toggleTheme} />
          <span className="slider">
            <span className="icon">{isDark ? <Moon size={14} /> : <Sun size={14} />}</span>
          </span>
        </label>
      </div>
      </div>
    </div>
  );
};

export default SettingsPage;
