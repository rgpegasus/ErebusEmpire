import React, { useState, useEffect, useContext } from 'react';
import { 
  MaximizeIcon, 
  MinimizeIcon, 
  WindowScreenIcon, 
  ReloadIcon, 
  CloseIcon, 
  ShareIcon, 
  CatalogIcon, 
  DownloadIcon, 
  NotificationIcon,
  ArrowIcon
} from '@utils/dispatchers/Icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '@context/user-context/UserContext';
import styles from './ToolBar.module.css';
import NotificationDropdown from '@layouts/dropdown/notification/Notification';
import { toUrl } from '@utils/functions/toUrl';


export default function ToolBar() {
  const { toolBar } = useContext(UserContext);
  const [show, setShow] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const [slug, setSlug] = useState('home');
  const [inputValue, setInputValue] = useState('https://erebusempire.github.io/?id=home'); 

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const cleanPath = location.pathname.replace(/^\/erebus-empire/, '') || '/home';
    setSlug(cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath);
  }, [location]);

  useEffect(() => {
    setInputValue('/' + slug);
  }, [slug]);
  useEffect(() => {
    const index = window.history.state?.idx ?? 0;
    const length = window.history.length;

    setCanGoBack(index > 0); 
    setCanGoForward(index < length - 1); 
  }, [location]);

  const handleFocus = () => {
    setInputValue(`https://erebusempire.github.io/?id=${slug}`);
  };

  const handleBlur = () => {
    const match = inputValue.match(/https:\/\/erebusempire\.github\.io\/\?id=(.+)/);
    if (match) setSlug(toUrl(match[1]));
    setInputValue('/' + (match ? toUrl(match[1]) : slug));
  };

const handleChange = (e) => {
  const val = e.target.value;
  const match = val.match(/https:\/\/erebusempire\.github\.io\/\?id=(.+)/);
  let newSlug;
  if (match) {
    newSlug = toUrl(match[1]);
  } else {
    newSlug = toUrl(val.replace(/^\//, ''));
  }
  setSlug(newSlug);
  setInputValue(val);
};


  const handleUrlSubmit = (e) => {
    e.preventDefault();
    navigate('/erebus-empire/' + (slug || 'home'));
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (e.clientY <= 5) setShow(true);
      if (e.clientY > 60) setShow(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const minimize = () => window.electronAPI.minimize();
  const toggleFullScreen = () => {
    window.electronAPI.toggleFullScreen();
    setIsFullScreen(!isFullScreen);
  };
  const close = () => window.electronAPI.close();

  return (
    <div className={`${styles.Container} ${show || toolBar ? styles.visible : ''}`} style={{ WebkitAppRegion: 'drag' }}>
      <div className={styles.ContainerNavigation}>
        <div
          style={{ WebkitAppRegion: 'no-drag', opacity: canGoBack ? 1 : 0.3, pointerEvents: canGoBack ? 'auto' : 'none' }}
          className={styles.ContainerButton}
          onClick={() => navigate(-1)}
        >
          <ArrowIcon className={`${styles.Arrow} ${styles.Left}`} />
        </div>

        <div
          style={{ WebkitAppRegion: 'no-drag', opacity: canGoForward ? 1 : 0.3, pointerEvents: canGoForward ? 'auto' : 'none' }}
          className={styles.ContainerButton}
          onClick={() => navigate(1)}
        >
          <ArrowIcon className={`${styles.Arrow} ${styles.Right}`} />
        </div>

        <div onClick={() => window.location.reload()} className={styles.ContainerButton}>
          <ReloadIcon style={{ WebkitAppRegion: 'no-drag' }} className={styles.Button}/>
        </div>
      </div>
      

      <div className={styles.InputContainer} style={{ WebkitAppRegion: 'no-drag' }}>
        <form onSubmit={handleUrlSubmit}>
          <input
            className={styles.Input}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={(e) => e.target.select()}
          />

          <ShareIcon
            className={styles.ShareButton}
            onClick={() => {
              const sharePath = slug; 
              navigator.clipboard.writeText('https://erebusempire.github.io/?id=' + sharePath)
                .then(() => alert('Lien copié !'))
                .catch(err => console.error('Impossible de copier :', err));
            }}
          />
        </form>
      </div>

      <div className={styles.RightButtons}>
        <div className={styles.ActionButtons}>
          <div style={{ WebkitAppRegion: 'no-drag' }}>
            <NotificationDropdown icon={<NotificationIcon className={styles.Button} />} />
          </div>
          <div style={{ WebkitAppRegion: 'no-drag' }} className={styles.ContainerButton} onClick={() => navigate('/erebus-empire/downloads')}>
            <DownloadIcon className={styles.Button} />
          </div>
          <div style={{ WebkitAppRegion: 'no-drag' }} className={styles.ContainerButton} onClick={() => navigate('/erebus-empire/catalog')}>
            <CatalogIcon className={styles.Button} />
          </div>
        </div>

        <div className={styles.ActionButtons}>
          <div style={{ WebkitAppRegion: 'no-drag' }} className={styles.ContainerButton} onClick={minimize}>
            <MinimizeIcon className={styles.Button} />
          </div>
          <div style={{ WebkitAppRegion: 'no-drag' }} className={styles.ContainerButton} onClick={toggleFullScreen}>
            {isFullScreen ? <MaximizeIcon className={styles.Button} /> : <WindowScreenIcon className={styles.Button} />}
          </div>
          <div style={{ WebkitAppRegion: 'no-drag' }} className={styles.ContainerButton} onClick={close}>
            <CloseIcon className={styles.Button} />
          </div>
        </div>
      </div>
    </div>
  );
}
