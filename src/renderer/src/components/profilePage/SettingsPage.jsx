import React, { useState, useEffect } from 'react';
import { Sun, Moon, Upload, Download } from 'lucide-react';


const SettingsPage = () => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light'; // Par défaut: dark
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const exportData = async () => {
    const filePath = await window.electron.ipcRenderer.invoke('export-data');
    if (filePath) {
      alert(`Données exportées avec succès vers ${filePath}`);
    } else {
      alert('Échec de l\'exportation');
    }
  };

  const importData = async () => {
    const filePath = window.electron.ipcRenderer.invoke('import-data');
    alert(filePath);
  };

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

  <div className="setting-item data-actions">
    <h2 className="setting-label">Données</h2>
    <div className="buttons-wrapper">
      <button className="data-button" onClick={exportData}>
        <Upload size={16} />
        Exporter
      </button>
      <button className="data-button" onClick={importData}>
        <Download size={16} />
        Importer
      </button>
    </div>
  </div>
</div>
    </div>
  );
};

export default SettingsPage;
