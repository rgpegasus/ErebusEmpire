import React, { useState, useEffect} from 'react';
import { Upload, Download, Bug, ShieldOff, ChevronLeftCircle} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
    const [isDev, setIsDev] = useState(() => {
       return localStorage.getItem('dev') == 'false'; 
    });
    const [isDevVisible, setIsDevVisible] = useState(() => {
      return localStorage.getItem('devUnlocked') == 'true';
    });

    useEffect(() => {
      if (isDev && isDevVisible) {
        window.electron.ipcRenderer.send('open-devtools');
      } else {
        window.electron.ipcRenderer.send('close-devtools');
      }
      localStorage.setItem('dev', isDev ? 'true' : 'false');
    }, [isDev]);
    const toggleDev = () => setIsDev(prev => !prev);
    const exportData = async () => {
    const filePath = await window.electron.ipcRenderer.invoke('export-data');
    if (filePath) {
      alert(`Données exportées avec succès vers ${filePath}`);
    } else {
      alert('Échec de l\'exportation');
    }
  };

const importData = async () => {
  const result = await window.electron.ipcRenderer.invoke('import-data');
  
  alert(result.message); 
  console.log(result.success, result.devUnlocked)
  if (result.success && result.devUnlocked) {
    setIsDevVisible(true)
    console.log(isDevVisible)
    localStorage.setItem('devUnlocked', isDevVisible  ? 'true' : 'false');
  }
};

   
    const navigate = useNavigate();
  return (
    <div className='MainPage'>
        <div  onClick={() =>navigate("/erebus-empire/profile/settings")}><ChevronLeftCircle size={30} className='BackButton'/></div>
        <h1 className='CategorieTitle'>Profil</h1>
        <div className='SettingsPage'>
            <div className='SettingsGroupe'>
                <div className="setting-item">
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

                {isDevVisible && (<div className="setting-item">
                    <h2 className="setting-label">Mode Dev</h2>
                    <label className="switch">
                      <input type="checkbox" checked={isDev} onChange={toggleDev} />
                      <span className="slider">
                        <span className="icon">{isDev ? <Bug size={14} /> : <ShieldOff size={14} />}</span>
                      </span>
                    </label>
                </div>)}
            </div> 
        </div>
        
    </div>
  );
};

