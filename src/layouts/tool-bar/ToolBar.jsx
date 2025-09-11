import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaRegWindowMaximize, FaRegWindowRestore, FaRegWindowMinimize } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import styles from './ToolBar.module.css'

export default function ToolBar() {
  const [show, setShow] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [url, setUrl] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Mettre à jour la barre avec la route actuelle
  useEffect(() => {
    setUrl(location.pathname);
  }, [location]);

  // Gérer apparition / disparition en fonction de la souris
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
      <div style={{ WebkitAppRegion: 'no-drag' }}>
        <form onSubmit={handleUrlSubmit}>
          <input
            className={styles.Input}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onClick={(e) => e.target.select()}
          />
        </form>
      </div>
      <div className={styles.ActionButtons} style={{ WebkitAppRegion: 'no-drag' }}>
        <div className={styles.ContainerButton} onClick={minimize}><FaRegWindowMinimize className={styles.Button} /></div>
        <div className={styles.ContainerButton} onClick={toggleFullScreen}>
          {isFullScreen ? <FaRegWindowMaximize className={styles.Button} /> : <FaRegWindowRestore className={styles.Button} />}
        </div>
        <div className={styles.ContainerButton} onClick={close}><MdClose className={styles.Button} /></div>
      </div>
    </div>
  );
}
