import React, { useState, useEffect, useContext } from 'react';
import styles from "./Settings.module.css"
import { UserContext } from '@context/user-context/UserContext';
import { useNavigate } from 'react-router-dom';
import { PinIcon, UnpinIcon, ProfileIcon, ColorPaletteIcon } from '@utils/dispatchers/Icons';
import { ChevronRight, ChevronDown, Rocket, BatteryLow, Bell, LucideBellOff } from 'lucide-react';
import BackgroundCover from "@components/background-cover/BackgroundCover"
import { LoginPageBackground } from "@utils/dispatchers/Pictures"
import { GrLanguage } from "react-icons/gr";
import { FaInfoCircle } from "react-icons/fa";
import { FlagDispatcher } from "@utils/dispatchers/Flags"
  const getUsageTime = () => {
    const savedTime = localStorage.getItem('usageTime'); 
    return savedTime ? parseInt(savedTime, 10) : 0;
  }; 
  
  const convertSecondsToTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secondsLeft = seconds % 60;
    return `${hours}h ${minutes}m ${secondsLeft}s`;
  };
const getDownloadDate = async () => {
  let savedDate = localStorage.getItem("downloadDate");

  if (!savedDate) {
    savedDate = await window.electron.ipcRenderer.invoke(
      "get-install-date"
    );

    localStorage.setItem("downloadDate", savedDate);
  }

  return savedDate;
};
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
export const Settings = ({ openTheme }) => {
  const { username, profileImage, toolBar, updateToolBar, favoriteLanguage, updateFavoriteLanguage } = useContext(UserContext);
  const [usageTime, setUsageTimeState] = useState(getUsageTime());
  const [downloadDate, setDownloadDate] = useState("");
  const navigate = useNavigate();
  const [languageDropdown, setLanguageDropdown] = useState(false);
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
  const loadInstallDate = async () => {
    const date = await getDownloadDate();
    setDownloadDate(date);
  };

  loadInstallDate();
}, []);
  useEffect(() => {
    const interval = setInterval(() => {
      setUsageTimeState(getUsageTime());
    }, 1000); 
    return () => clearInterval(interval);
  }, []);

  const [isPerf, setIsPerf] = useState(() => {
    return localStorage.getItem('perf') !== 'full';
  });
  const [isNotif, setIsNotif] = useState(() => {
    return localStorage.getItem('notif') !== 'off';
  });
  useEffect(() => {
    localStorage.setItem('perf', isPerf ? 'full' : 'eco');
  }, [isPerf]);
  useEffect(() => {
  localStorage.setItem('notif', isNotif ? 'on' : 'off');
    window.dispatchEvent(new Event('notifChanged'));
  }, [isNotif]);
  
  
  const togglePerf = () => setIsPerf(prev => !prev);
  const togglePin = () => {
    updateToolBar(!toolBar)
  }
  const toggleNotif = () => setIsNotif(prev => !prev);
  const toggleFavoriteLanguageMenu = (newLanguage) => {
    updateFavoriteLanguage(newLanguage)
  }
  return (
    <div className="MainPage">
      {/* <BackgroundCover coverInfo={LoginPageBackground} whileWatching={false} isAnime={false} /> */}
      <div className={styles.Container}>
        <div className={styles.Title}>Paramètres</div>
        <div className={styles.SubTitle}>Gérez votre compte et personalisez votre expérience.</div>
        <div className={styles.Group}>
          <div
            className={`${styles.Item} ${styles.Profil}`}
            onClick={() => navigate("/erebus-empire/settings/profile")}
          >
            <div className={styles.UserInfo}>
              {profileImage && !imageError ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className={styles.ProfilImg}
                  draggable="false"
                  onError={() => setImageError(true)}
                />
              ) : (
                <ProfileIcon className={styles.ProfilImg} />
              )}
              <div className={styles.UserInfoContainer}>
                <div className={styles.Username}>{username}</div>
                <div className={styles.DownloadDate}>
                  Membre depuis le {formatDate(downloadDate)}
                </div>
              </div>
            </div>
            <div className={styles.UsageTimeContainer}>
              <div className={styles.UserInfoContainer}>
                <span className={styles.UsageTimeTitle}>Temps d'utilisation</span>
                <span className={styles.UsageTimeTime}>{convertSecondsToTime(usageTime)}</span>
              </div>
              <span>
                <ChevronRight className={styles.ChevronIcon} />
              </span>
            </div>
          </div>
        </div>
        <div className="Space"></div>
        <div className={styles.GroupTitle}>Préférences</div>
        <div className={styles.Group}>
          <div className={`${styles.Item} ${styles.Theme}`} onClick={openTheme}>
            <div className={styles.ItemContainer}>
              <div>
                <ColorPaletteIcon className={styles.ItemIcon} />
              </div>
              <div className={styles.ItemInfo}>
                <span className={styles.ItemTitle}>Personnaliser le thème</span>
                <span className={styles.ItemSubTitle}>
                  Choisissez l'apparence qui vous correspond
                </span>
              </div>
            </div>
            <span>
              <ChevronRight className={styles.ChevronIcon} />
            </span>
          </div>
          <div className={styles.Item}>
            <div className={styles.ItemContainer}>
              <div>
                <PinIcon className={styles.ItemIcon} />
              </div>
              <div className={styles.ItemInfo}>
                <span className={styles.ItemTitle}>Fixer la barre d'outils</span>
                <span className={styles.ItemSubTitle}>Gardez vos outils à portée de main</span>
              </div>
            </div>
            <label className={styles.Switch}>
              <input type="checkbox" checked={toolBar} onChange={togglePin} />
              <span className={styles.Slider}>
                <span className={styles.Icon} />
              </span>
            </label>
          </div>
          <div className={styles.Item}>
            <div className={styles.ItemContainer}>
              <div>
                <Bell className={styles.ItemIcon} />
              </div>
              <div className={styles.ItemInfo}>
                <span className={styles.ItemTitle}>Notifications</span>
                <span className={styles.ItemSubTitle}>Gérez vos préférences de notifications</span>
              </div>
            </div>
            <label className={styles.Switch}>
              <input type="checkbox" checked={isNotif} onChange={toggleNotif} />
              <span className={styles.Slider}>
                <span className={styles.Icon} />
              </span>
            </label>
          </div>
        </div>
        <div className="Space"></div>
        <div className={styles.GroupTitle}>Langue et région</div>
        <div className={styles.Group}>
          <div className={styles.Item}>
            <div className={styles.ItemContainer}>
              <div>
                <GrLanguage className={styles.ItemIcon} />
              </div>
              <div className={styles.ItemInfo}>
                <span className={styles.ItemTitle}>Langue favorite</span>
                <span className={styles.ItemSubTitle}>
                  Choisissez votre langue préférée pour regarder des animés
                </span>
              </div>
            </div>
            <div onClick={() => setLanguageDropdown(!languageDropdown)}>
              <div className={styles.DropdownButton}>
                <div className={styles.LangContainer}>
                  <img
                    onClick={() => onLanguageChange(lang)}
                    src={FlagDispatcher(favoriteLanguage.toLowerCase())}
                    alt={favoriteLanguage}
                    draggable="false"
                    className={styles.Flag}
                  />
                  <div className={styles.FlagLanguage}>{favoriteLanguage}</div>
                </div>
                <div>
                  <ChevronDown />
                </div>
              </div>
              {languageDropdown && (
                <div className={styles.DropdownMenu}>
                  <div
                    className={`${styles.DropdownItem} ${favoriteLanguage == "vostfr" && styles.FavoriteLanguage}`}
                    onClick={() => updateFavoriteLanguage("vostfr")}
                  >
                    Japonais (vostfr)
                  </div>
                  <div
                    className={`${styles.DropdownItem} ${favoriteLanguage == "vf" && styles.FavoriteLanguage}`}
                    onClick={() => updateFavoriteLanguage("vf")}
                  >
                    Français (vf)
                  </div>
                  <div
                    className={`${styles.DropdownItem} ${favoriteLanguage == "va" && styles.FavoriteLanguage}`}
                    onClick={() => updateFavoriteLanguage("va")}
                  >
                    Anglais (va)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="Space"></div>
        <div className={styles.Group}>
          <div className={styles.Item}>
            <div className={styles.ItemContainer}>
              <div>
                <FaInfoCircle className={styles.ItemIcon} />
              </div>
              <div className={styles.ItemInfo}>
                <span className={styles.ItemTitle}>Besoin d'aide ?</span>
                <span className={styles.ItemSubTitle}>
                  Consultez notre centre d'aide ou contactez notre support
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="Space"></div>
      <div className="Space"></div>
    </div>
  )
};
