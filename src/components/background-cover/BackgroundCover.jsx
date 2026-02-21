import React, { useState, useRef, useEffect} from "react";
import styles from "./BackgroundCover.module.css"
import { PlayIcon, AddIcon, ArrowIcon } from "@utils/dispatchers/Icons"
import { useNavigate } from "react-router-dom";
import { useLoader } from '@utils/dispatchers/Page';
import ScrollTitle from '@components/scroll-title/ScrollTitle';
import { toSlug } from '@utils/functions/toSlug'
const BackgroundCover = ({ coverInfo, whileWatching = false, isAnime = true}) => {
    const [moreDetails, setMoreDetails] = useState(false)
    const { setLoading } = useLoader();
    const navigate = useNavigate();
    const StatusDropdownRef = useRef(null)
    const AddButtonRef = useRef(null)
    const [height, setHeight] = useState(0)
    const contentRef = useRef(null)
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [animeStatus, setAnimeStatus] = useState({
      favoris: false,
      watchlist: false,
      attente: false,
      dejaVu: false,
    });
    const statusStorageMap = {
      favoris: "animeFavorites",
      watchlist: "animeWatchlist",
      attente: "animeOnHold",
      dejaVu: "animeAlreadySeen",
    };
    const getAnimeId = (url) => {
        const cleanUrl = new URL(url);
        const pathname = cleanUrl.pathname.replace(/\/$/, '');
        const parts = pathname.split('/').filter(Boolean);
        return parts[parts.length - 1]; 
    };    
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (AddButtonRef.current && !AddButtonRef.current.contains(event.target) && StatusDropdownRef.current && !StatusDropdownRef.current.contains(event.target)) {
          setShowStatusMenu(false)
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const animeId = coverInfo?.url ? getAnimeId(coverInfo.url) : null;
    useEffect(() => {
        if (!animeId) return;
        const loadAllStatuses = async () => {
            const statusObj = { ...animeStatus };
            for (const key of Object.keys(statusObj)) {
                const storageName = statusStorageMap[key];
                const storageKey = animeId ? `/erebus-empire/${animeId}` : null;
                const value = await animeData.load(storageName, storageKey);
                statusObj[key] = !!value; 
            }
            setAnimeStatus(statusObj);
        };
        loadAllStatuses();
    }, [animeId]);
    const buildAnimeData = () => ({
        animeId,
        animeTitle:coverInfo.title,
        animeCover: coverInfo.cover,
      });
    const toggleStatus = async (key) => {
      const isActive = animeStatus[key];
      const updatedStatus = { ...animeStatus, [key]: !isActive };
      setAnimeStatus(updatedStatus);
    
      const storageName = statusStorageMap[key];
      const storageKey = animeId ? `/erebus-empire/${animeId}` : null;
    
      if (!isActive) {
        await animeData.save(storageName, storageKey, buildAnimeData());
      } else {
        await animeData.delete(storageName, storageKey);
      }
    };
    
    const navigateToEpisode = async (coverInfo) => {
        let episodesData = {};
        try {
            setLoading(true);
            const result = await window.electron.ipcRenderer.invoke('get-seasons', coverInfo.url);
            if (!result || result.error || result?.length === 0) {
                console.warn("Aucune saison trouvée ou erreur:", result?.error);
                setLoading(false);
                return;
            }
            const languages = await window.electron.ipcRenderer.invoke('get-available-languages', result[0].url);
            const selectedLanguage = result[0].url.split("/").slice(6,7)[0]
            
            for (const lang of languages ) {
                const saisonUrl = `${result[0].url.split("/").slice(0,6).join("/")}/${lang.toLowerCase()}`
                const episodeLinks = await window.electron.ipcRenderer.invoke('get-episodes', saisonUrl, true);
                episodesData[lang.toLowerCase()] = episodeLinks;
            }
            
            
            if (!episodesData || episodesData.length === 0) {
                console.warn("Aucun épisode trouvé pour cette saison.");
                return;
            }
            const animeId = getAnimeId(coverInfo.url)
            const seasonId = result[0].url.split("/")[5]
            const episodeId = toSlug(episodesData[selectedLanguage][0].title);
            const path = `/erebus-empire/${animeId}/${seasonId}/${episodeId}`;
            navigate(path, {
            state: {
                episodeTitle: episodesData[selectedLanguage][0].title,
                animeId,
                episodes:episodesData,
                seasonId,
                animeTitle: coverInfo.title,
                seasonTitle: result[0].title,
                animeCover: coverInfo.cover,
                seasonUrl: result[0].url,
                availableLanguages:languages,
                selectedLanguage
            }
        });
        } catch (error) {
        console.error("Erreur dans handleEpisodeClick :", error);
        } finally {
            setLoading(false);
        }
    }
    

    useEffect(() => {
        if (contentRef.current) {
        setHeight(contentRef.current.scrollHeight); 
        }
    }, [moreDetails, coverInfo?.synopsis]);

    return (
        <div className={`${styles.Container} ${!isAnime && styles.IsNotAnime}`}>
            <div className={`${isAnime? styles.CoverMask : ""}`}>
                {isAnime ? (
                    <img 
                        src={coverInfo?.cover}
                        className={`${styles.Cover} ${styles.IsAnime}`}
                        alt={coverInfo?.title}
                        draggable="false"
                    />   
                ):(
                    <img 
                        src={coverInfo}
                        className={styles.Cover}
                        draggable="false"
                    />    
                )}
                 
            </div>
            {isAnime && (
                <div className={styles.ElementsContainer} >
                    {whileWatching && (
                        <h2 className={styles.WhileWatching}>En train de regarder</h2>
                    )}
                    <div className={`${styles.AnimeTitle} ${!whileWatching? styles.TitleHover : ""}`} onClick={()=> {if (!whileWatching) {navigate(`/erebus-empire/${getAnimeId(coverInfo?.url)}/`)}}}>
                        <ScrollTitle title={coverInfo?.title}/>
                    </div>
                    <h2 className={styles.AltTitles}>{coverInfo?.altTitles.slice(0, 1).join(', ')}</h2>
                    <div className={styles.Buttons}>
                        <div className={styles.SeeContainer} onClick={()=> navigateToEpisode(coverInfo)}>
                            <PlayIcon className={styles.SeeIcon}/>
                            <h1 className={styles.SeeTitle}>Regarder</h1>
                        </div>
                        <div className={styles.AddContainer} ref={AddButtonRef} onClick={() => setShowStatusMenu(!showStatusMenu)}>
                            <AddIcon className={styles.AddIcon}/>
                            <h1 className={styles.AddTitle}>Ajouter</h1>
                        </div>
                        {showStatusMenu && (
                            <div ref={StatusDropdownRef} className={styles.AddDropdown}>
                            {["favoris", "watchlist", "attente", "dejaVu"].map((key) => (
                                <label key={key} className={styles.AddDropdownItem}>
                                <input
                                    id={`status-${key}`}
                                    type="checkbox"
                                    checked={animeStatus[key]}
                                    onChange={() => toggleStatus(key)}
                                    className={styles.HiddenAddDropdown}
                                />
                                <span  htmlFor={`status-${key}`} className={styles.CustomCheckbox}></span>

                                {key.charAt(0).toUpperCase() + key.slice(1)}
                                </label>
                            ))} 
                            </div>
                        )}
                    </div>
                    {coverInfo?.genres && (
                        <div className={styles.GenresContainer}>
                            <h2 className={styles.GenresTitle}>Genres :</h2>
                            <h2 className={styles.GenresTxt}>{coverInfo.genres.slice(0, 7).join(', ')}</h2>
                        </div>
                    )}
                    <div className={styles.SynopsisWrapper}  style={{ height: `calc(${height}px - 195px)` }} >
                        <div ref={contentRef} className={styles.SynopsisContent}>
                            {!moreDetails ? (
                            <div className={styles.MoreSynopsisGlobalContainer}>
                                <div className={styles.MoreSynopsisContainer}>
                                    <p className={styles.MoreSynopsisTxt}>{coverInfo?.synopsis}</p>
                                </div>
                                <div className={styles.DetailsContainer} onClick={() => setMoreDetails(true)}>
                                    <h1 className={styles.DetailsTitle}>Plus de détails</h1>
                                    <ArrowIcon className={styles.MoreDetailsIcon}/>
                                </div>
                            </div>
                            ) : (
                            <div className={styles.LessSynopsisGlobalContainer}>
                                <div className={styles.LessSynopsisContainer}>
                                    <p className={styles.LessSynopsisTxt}>{coverInfo.synopsis}</p>
                                </div>
                                <div className={styles.DetailsContainer} onClick={() => setMoreDetails(false)}>
                                    <h1 className={styles.DetailsTitle}>Moins de détails</h1>
                                    <ArrowIcon className={styles.LessDetailsIcon}/>
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default BackgroundCover