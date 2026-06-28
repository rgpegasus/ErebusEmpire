import React, { useState, useEffect} from 'react';
import { Upload, Download, Bug, ShieldOff, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackgroundCover from "@components/background-cover/BackgroundCover"
import { LoginPageBackground } from "@utils/dispatchers/Pictures"
import { supabase } from "@services/supabase/Client"
import styles from "../Settings.module.css"
import { TbLogin2, TbLogout2 } from "react-icons/tb";
import { AiOutlineDatabase } from "react-icons/ai";
import { FaDev } from "react-icons/fa";
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
  const result = await window.electron.ipcRenderer.invoke('import-data');
  if(result) {
    alert(result?.message)
    if (result?.success && result?.devUnlocked) {
      setIsDevVisible(true)
      localStorage.setItem("devUnlocked", "true")
    }
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
      {/* <BackgroundCover coverInfo={LoginPageBackground} whileWatching={false} isAnime={false} /> */}
      <div className={styles.Container}>
        <div className={styles.Title}>Profile</div>
        <div className={styles.Group}>
          {!session ? (
            <div className={`${styles.Item} ${styles.Theme}`} onClick={() => navigate("/erebus-empire/login")}>
              <div className={styles.ItemContainer}>
                <div><TbLogin2 className={styles.ItemIcon}/></div>
                <div className={styles.ItemInfo}>
                  <span className={styles.ItemTitle}>Se connecter</span>
                  <span className={styles.ItemSubTitle}>Connectez vous pour sauvegarder votre progression sur tous vos appareils</span>
                </div>
              </div>
              <span>
                <ChevronRight className={styles.ChevronIcon} />
              </span>
            </div>
          ) : (
            <div className={`${styles.Item} ${styles.Theme}`} onClick={handleSignOut}>
              <div className={styles.ItemContainer}>
                <div><TbLogout2  className={styles.ItemIcon}/></div>
                <div className={styles.ItemInfo}>
                  <span className={styles.ItemTitle}>Se déconnecter</span>
                  <span className={styles.ItemSubTitle}>Déconnectez vous de cet appareil</span>
                </div>
              </div>
              <span/>
            </div>
          )}
          <div className={`${styles.Item} ${styles.Theme}`}>
            <div className={styles.ItemContainer}>
              <div><AiOutlineDatabase className={styles.ItemIcon}/></div>
              <div className={styles.ItemInfo}>
                <span className={styles.ItemTitle}>Données</span>
                <span className={styles.ItemSubTitle}>Exportez ou importez vos données</span>
              </div>
            </div>
            <div className={styles.ButtonsWrapper}>
              <button className={styles.DataButton} onClick={exportData}>
                <Upload size={16} />
                Exporter
              </button>
              <button className={styles.DataButton} onClick={importData}>
                <Download size={16} />
                Importer
              </button>
            </div>
          </div>
          

          {isDevVisible && (
            <div className={styles.Item}>
              <div className={styles.ItemContainer}>
                <div><FaDev className={styles.ItemIcon}/></div>
                <div className={styles.ItemInfo}>
                  <span className={styles.ItemTitle}>Mode Dev</span>
                  <span className={styles.ItemSubTitle}>Activez le mode développement pour afficher la console</span>
                </div>
              </div>
              <label className={styles.Switch}>
                <input type="checkbox" checked={isDev} onChange={toggleDev} />
                <span className={styles.Slider}><span className={styles.Icon}/></span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
};

