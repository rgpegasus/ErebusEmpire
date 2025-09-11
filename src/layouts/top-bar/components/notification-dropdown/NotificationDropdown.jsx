import React, { useEffect, useState, useRef } from 'react';
import { NotificationIcon } from '@utils/dispatchers/Icons'
import { getRealEpisodeName } from '@utils/functions/getRealEpisodeName'
import { useLoader } from '@utils/dispatchers/Page';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationDropdown.module.css';
import ImgLoader from '@components/img-loader/ImgLoader';


const NotificationDropdown = () => {
  const [notif, setNotif] = useState(localStorage.getItem('notif') || 'on');

useEffect(() => {
  const updateNotifState = () => {
    const notifState = localStorage.getItem('notif') || 'on';
    setNotif(notifState);
    console.log("notif state updated:", notifState);
  };

  window.addEventListener('notifChanged', updateNotifState);

  return () => window.removeEventListener('notifChanged', updateNotifState);
}, []);


const [notifVisible, setNotifVisible] = useState(false);
const [notifiedEpisodes, setNotifiedEpisodes] = useState([]);
const notifVisibleRef = useRef(notifVisible);
const notifiedEpisodesRef = useRef(null);
const { setLoading } = useLoader();
const iconRef = useRef(null);
const navigate = useNavigate();
useEffect(() => {
    notifVisibleRef.current = notifVisible;
}, [notifVisible]);
  useEffect(() => {
  const handleClickOutside = (event) => {
    setTimeout(() => {
      if (
        notifVisibleRef.current &&
        notifiedEpisodesRef.current &&
        !notifiedEpisodesRef.current.contains(event.target) &&
        !iconRef.current?.contains(event.target)
        ) {
        setNotifVisible(false);
        }
    }, 0);
  };

  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, []);

  const loadNotifiedEpisodes = async () => {
    const all = await animeData.loadAll("notifiedEpisodes");
    if (!all) return;
    const episodes = Array.isArray(all) ? all : Object.values(all);
    episodes.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    setNotifiedEpisodes(episodes);
  };

  const toggleNotifiedEpisodes = () => {
    if (!notifVisible) {
      loadNotifiedEpisodes(); 
    }
    setNotifVisible(prev => {
      const newVisible = !prev;
      return newVisible;
    });
  }

    const handleEpisodeClick = async (episode) => {
    try {
      setLoading(true)
      const { path, matchedEmbed, embedData, animeId, seasonId, seasonTitle } = await getRealEpisodeName(episode);
      setNotifVisible(false)
      const episodes = {[episode.language]: embedData};
      if (path) {
        navigate(path, {
          state: {
            episodeTitle: matchedEmbed.title,
            episodes: episodes,
            animeId,
            seasonId,
            animeTitle: episode.title,
            seasonTitle,
            animeCover:episode.cover,
            seasonUrl:episode.url,
            availableLanguages:[episode.language],
            selectedLanguage:episode.language
          },
        });
      }
      setLoading(false)
    } catch (err) {
      console.error("Erreur lors de la navigation :", err);
    }
  };
return (
    <>
        <div className={styles.LogoBox} ref={iconRef}>
          <NotificationIcon
              className={styles.Logo}
              onClick={toggleNotifiedEpisodes}
          />
        </div>
        {notifVisible && notif === 'on' ? (
          <div className={styles.List} ref={notifiedEpisodesRef}>
            {notifiedEpisodes?.length > 0 ? (
                <div>
                    {notifiedEpisodes.map((episode) => (
                        <div key={episode.title} className={styles.Item} onClick={() => handleEpisodeClick(episode)}>
                           <div className={styles.Cover}>
                              <ImgLoader
                                key={episode.title + episode.cover}
                                anime={episode}
                              />
                            </div>
                            <div>
                                <h3 className={styles.AnimeTitle}>{episode?.title}</h3>
                                <h4 className={styles.EpisodeTitle}>{`${episode.language?.toUpperCase()} - ${episode?.episode}`}</h4>
                            </div>
                       </div>
                    ))} 
                </div>
            ) : (
              <div className='AFK'>Aucun épisode sorti</div>
            )}
          </div>
        ) : notifVisible &&(
          <div className={styles.List} ref={notifiedEpisodesRef}>
            <div className='AFK' onClick={() => {
              navigate('/erebus-empire/profile/settings'); 
              setNotifVisible(false);}
            }>
              Activer les notifications
            </div>
          </div>
        )}
    </>
  );
};

export default NotificationDropdown;
