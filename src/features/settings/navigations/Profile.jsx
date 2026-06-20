import React, { useState, useEffect} from 'react';
import { Upload, Download, Bug, ShieldOff, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackgroundCover from "@components/background-cover/BackgroundCover"
import { LoginPageBackground } from "@utils/dispatchers/Pictures"
import { supabase } from "@services/supabase/Client"


export const Profile = () => {
    const [isDev, setIsDev] = useState(() => {
       return localStorage.getItem('dev') == 'false'; 
    });
    const [isDevVisible, setIsDevVisible] = useState(() => {
      return localStorage.getItem('devUnlocked') == 'true';
    });
    const [session, setSession] = useState(null);
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
  async function isUserLoggedIn() {
    const { data: userData } = await supabase.auth.getUser()
    return !!userData?.user
  }
const importData = async () => {
  const loggedIn = await isUserLoggedIn()
  if (!loggedIn) {
    const result = await window.electron.ipcRenderer.invoke('import-data');
    
    alert(result.message); 
    console.log(result.success, result.devUnlocked)
    if (result.success && result.devUnlocked) {
      setIsDevVisible(true)
      console.log(isDevVisible)
      localStorage.setItem('devUnlocked', isDevVisible  ? 'true' : 'false');
    }
  } else {
    await window.electron.ipcRenderer.invoke("import-data-to-supabase")
  }
};
  const navigate = useNavigate();
  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session: res },
      } = await supabase.auth.getSession()
      
      setSession(res)
    }

    loadSession()
  }, [])
  
   
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate("/erebus-empire/home")
    localStorage.removeItem("numberStartErebus")
    setSession(null)
  }

  return (
    <div className="MainPage">
      <BackgroundCover coverInfo={LoginPageBackground} whileWatching={false} isAnime={false} />
      <div className="SettingsPage">
        <div className="SettingsTitle">Profile</div>
        <div className="SettingsGroupe">
          {!session ? (
            <div className="setting-item theme" onClick={() => navigate("/erebus-empire/login")}>
              <span className="setting-label">Se connecter</span>
              <span className="Settings-ChevronIcon">
                <ChevronRight />
              </span>
            </div>
          ) : (
            <div className="setting-item theme" onClick={handleSignOut}>
              <span className="setting-label">Se déconnecter</span>
            </div>
          )}
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

          {isDevVisible && (
            <div className="setting-item">
              <h2 className="setting-label">Mode Dev</h2>
              <label className="switch">
                <input type="checkbox" checked={isDev} onChange={toggleDev} />
                <span className="slider">
                  <span className="icon">
                    {isDev ? <Bug size={14} /> : <ShieldOff size={14} />}
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
};

