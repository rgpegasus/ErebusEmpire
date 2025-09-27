import React, { useState, useEffect } from 'react';
import { MaximizeIcon, MinimizeIcon, WindowScreenIcon, ReloadIcon, CloseIcon, ShareIcon } from '@utils/dispatchers/Icons'
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ToolBar.module.css'


export default function ToolBar() {
  const [show, setShow] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [url, setUrl] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setUrl(location.pathname);
  }, [location]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (e.clientY <= 5) {
        setShow(true);
      }
    };
    const handleMouseLeave = (e) => {
      if (e.clientY > 60) {
        setShow(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousemove', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousemove', handleMouseLeave);
    };
  }, []);
  const minimize = () => window.electronAPI.minimize();
  const toggleFullScreen = () => {
    window.electronAPI.toggleFullScreen();
    setIsFullScreen(!isFullScreen);
  };
  const close = () => window.electronAPI.close();

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (url.trim() !== '') navigate(url);
  };

  return (
    <div className={`${styles.Container} ${show ? styles.visible : ''}`} style={{ WebkitAppRegion: 'drag' }}>
      <div onClick={()=> window.location.reload()} className={styles.ContainerButton}><ReloadIcon className={styles.Button}/></div>
      <div className={styles.InputContainer} style={{ WebkitAppRegion: 'no-drag' }}>
        <form onSubmit={handleUrlSubmit}>
          <input
            className={styles.Input}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onClick={(e) => e.target.select()}
          />
          <ShareIcon
            className={styles.ShareButton}
            onClick={() => {
              navigator.clipboard.writeText("erebusempire:/" + url)
                .then(() => alert("Lien copié !"))
                .catch(err => console.error("Impossible de copier :", err));
            }}
          />
        </form>
      </div>
      <div className={styles.ActionButtons} style={{ WebkitAppRegion: 'no-drag' }}>
        <div className={styles.ContainerButton} onClick={minimize}><MinimizeIcon className={styles.Button} /></div>
        <div className={styles.ContainerButton} onClick={toggleFullScreen}>
          {isFullScreen ? <MaximizeIcon className={styles.Button} /> : <WindowScreenIcon className={styles.Button} />}
        </div>
        <div className={styles.ContainerButton} onClick={close}><CloseIcon className={styles.Button} /></div>
      </div>
    </div>
  );
}