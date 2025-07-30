import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { FaDiscord, FaDonate, FaUserCircle } from "react-icons/fa";
import { LuCircleCheckBig } from "react-icons/lu";
import { IoSettingsSharp } from "react-icons/io5";
import { FaEye } from "react-icons/fa6";
import { PiClockCounterClockwiseBold } from "react-icons/pi";
import { BsHourglassSplit } from "react-icons/bs";
import { MdFavorite } from "react-icons/md";
import { SmallErebusIcon, SwitchAccountIcon, LogOutIcon} from '@utils/PictureDispatcher';
import OverlayPortal from '@components/OverlayPortal';


function UtilityTopBar() {
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [username, setUsername] = useState("User");
  const [isEditingName, setIsEditingName] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedImage = localStorage.getItem('croppedProfileImage');
    const savedName = localStorage.getItem('username');
    if (savedImage) setCroppedImage(savedImage);
    if (savedName?.trim()) setUsername(savedName.trim());

    const handleClickOutside = (e) => {
      if (!e.target.closest('.utility-portal-content')) {
        setMenuVisible(false);
        setShowOptions(false);
        setImageSrc(null);
        setIsEditingName(false)
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
    setShowOptions(false);
  };

const handleProfileClick = () => {
    if (editMode) {
      setShowOptions(!showOptions);
    }
  };

  const handleUsernameChange = (e) => {
    const name = e.target.value.trim() || "User";
    setUsername(name);
    localStorage.setItem("username", name);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') setIsEditingName(false);
  };

  const onFileChange = (e) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      };
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = null;
    }
  };

  const resetProfilePhoto = () => {
    setCroppedImage(null);
    setImageSrc(null);
    localStorage.removeItem('croppedProfileImage');
    setShowOptions(false);
  };

  const onCropComplete = useCallback((_, areaPixels) => setCroppedAreaPixels(areaPixels), []);

  const showCroppedImage = useCallback(async () => {
    try {
      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
      setCroppedImage(cropped);
      localStorage.setItem('croppedProfileImage', cropped);
      setImageSrc(null);
    } catch (e) {
      console.error('Erreur de recadrage', e);
    }
  }, [imageSrc, croppedAreaPixels]);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
    const CloseMenu = () => {
        setEditMode(false);
        setShowOptions(false);
        setMenuVisible(!menuVisible)
      };
  const getCroppedImg = async (imageSrc, croppedAreaPixels) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve) => {
      const base64Image = canvas.toDataURL('image/jpeg');
      resolve(base64Image);
    });
  };
  const navigateProfilPage = async (path) => {
    setMenuVisible(!menuVisible)
    navigate(path)
  }
  return (
    <div className="TopBar-profile">
      <div className="TopBar-profile-wrapper" onClick={CloseMenu}>
        {croppedImage? (<img src={ croppedImage } alt="Profil" className="TopBar-profile-img" draggable="false" />):<FaUserCircle className="TopBar-profile-img"/>}
        <ChevronDown size={18} color="#996e35" style={{ marginLeft: 4 }} />
      </div>

      {menuVisible && (
        <div>
            <OverlayPortal>
              <div className="UtilityTopBar-overlay" onClick={() => setMenuVisible(!menuVisible)}></div>
              <div className="TopBar-profile-menu utility-portal-content">
                  <div className="UtilityTopBar">
                  <div className='UtilityTopBar-profil'>
                      <div onClick={handleProfileClick}>
                      {croppedImage
                        ? ( <img src={ croppedImage } alt="Profil" className={`UtilityTopBar-image ${editMode ? 'editable' : ''}`} draggable="false" />)
                        : ( <FaUserCircle className={`UtilityTopBar-image ${editMode ? 'editable' : ''}`}/> )
                      }
                      <input
                          type="file"
                          accept="image/*"
                          onChange={onFileChange}
                          className="UtilityTopBar-image-input"
                          id="upload"
                      />
                      {editMode && showOptions && (
                          <div className="UtilityTopBar-edit">
                          <label htmlFor="upload" className="UtilityTopBar-edit-option" onClick={() => document.getElementById('upload').click()}>
                              Modifier l’image
                          </label>
                          <button className="UtilityTopBar-edit-option" onClick={resetProfilePhoto}>Supprimer l’image</button>
                          </div>
                      )}
                      </div>
                      <div className='UtilityTopBar-pseudo'>
                          <div className='UtilityTopBar-name' onClick={() => editMode && setIsEditingName(true)}>
                              {isEditingName ? (
                              <input
                                  className="UtilityTopBar-name-input"
                                  type="text"
                                  maxlength="16"
                                  value={username}
                                  onChange={handleUsernameChange}
                                  placeholder="Entrez un pseudo"
                                  onKeyDown={handleNameKeyDown}
                                  onBlur={() => setIsEditingName(false)}
                                  autoFocus
                              />
                              ) : (
                              <div  className={`UtilityTopBar-name ${editMode ? 'editable' : ''}`}>{username}</div>
                              )}
                          </div>
                          <div className='UtilityTopBar-app'>
                              <img
                              src={SmallErebusIcon}
                              alt="app"
                              draggable="false"
                              className="UtilityTopBar-app-logo"
                              />
                              <h1 className='UtilityTopBar-app-title'>Erebus Empire</h1>
                          </div>
                      </div>
                  </div>
                  <div className='UtilityTopBar-button'>
                      <span className="UtilityTopBar-button-item" onClick={toggleEditMode}>
                          {editMode ? '✖' : '✎'}
                      </span>
                  </div>

                  {imageSrc && (
                    <OverlayPortal>
                        <div className="UtilityTopBar-overlay">
                          <div className="UtilityTopBar-container utility-portal-content">
                              <div className="UtilityTopBar-top">
                              <h1 className="UtilityTopBar-title">Modifier l'image</h1>
                              <span className="UtilityTopBar-cancel" onClick={() => setImageSrc(null)}>✖</span>
                              </div>
                              <div className="UtilityTopBar-cropper">
                              <Cropper
                                  image={imageSrc}
                                  crop={crop}
                                  showGrid={false}
                                  zoom={zoom}
                                  aspect={1}
                                  onCropChange={setCrop}
                                  onZoomChange={setZoom}
                                  onCropComplete={onCropComplete}
                                  cropShape="round"
                              />
                              </div>
                              <div className="UtilityTopBar-zoom">
                              <input
                                  type="range"
                                  min={1}
                                  max={3}
                                  step={0.1}
                                  value={zoom}
                                  onChange={(e) => setZoom(e.target.value)}
                              />
                              </div>
                              <div className="UtilityTopBar-bottom">
                              <button className="UtilityTopBar-reset" onClick={() => {
                                  setCrop({ x: 0, y: 0 });
                                  setZoom(1);
                              }}>Réinitialiser</button>
                              <button className="UtilityTopBar-apply" onClick={showCroppedImage}>Appliquer</button>
                              </div>
                          </div>
                        </div>
                      </OverlayPortal>
                  )}
                  </div>
                  <div className='TopBar-profile-separation'></div>

                  <div onClick={() => navigateProfilPage("/erebus-empire/profile/settings")} className='TopBar-profile-menu-item'>
                    <IoSettingsSharp className='TopBar-profile-menu-logo'/>
                    Paramètres
                  </div>
                  {/* <div onClick={() => navigateProfilPage("/erebus-empire/profile/switchAccount")} className='TopBar-profile-menu-item'><img draggable="false" src={SwitchAccountIcon}/>Changer de profil</div> */}
                  <div className='TopBar-profile-separation'></div>
                  <div onClick={() => navigateProfilPage("/erebus-empire/profile/favorites")} className='TopBar-profile-menu-item'>
                    <MdFavorite className='TopBar-profile-menu-logo'/>
                    Favoris
                  </div>
                  <div onClick={() => navigateProfilPage("/erebus-empire/profile/watchlist")} className='TopBar-profile-menu-item'>
                    <FaEye className='TopBar-profile-menu-logo'/>
                    Watchlist
                  </div>
                  <div onClick={() => navigateProfilPage("/erebus-empire/profile/history")} className='TopBar-profile-menu-item'>
                    <PiClockCounterClockwiseBold className='TopBar-profile-menu-logo'/>
                    Historique
                  </div>
                  <div onClick={() => navigateProfilPage("/erebus-empire/profile/onHold")} className='TopBar-profile-menu-item'>
                    <BsHourglassSplit className='TopBar-profile-menu-logo'/>
                    En attente
                  </div>
                  <div onClick={() => navigateProfilPage("/erebus-empire/profile/alreadySeen")} className='TopBar-profile-menu-item'>
                    <LuCircleCheckBig className='TopBar-profile-menu-logo'/>
                    Déjà Vu
                  </div>
                  <div className='TopBar-profile-separation'></div>
                  <div onClick={() => window.open("https://discord.gg/Mj9cYRQTcU", "_blank")} className='TopBar-profile-menu-item'>
                    <FaDiscord className='TopBar-profile-menu-logo' />
                    Discord
                  </div>

                  <div onClick={() => window.open("https://www.paypal.com/donate?hosted_button_id=rgpegasus_pro", "_blank")} className='TopBar-profile-menu-item'>
                    <FaDonate className='TopBar-profile-menu-logo' />
                    Soutenir
                  </div>

                  {/* <div className='TopBar-profile-menu-item'><img draggable="false" src={LogOutIcon}/>Se déconnecter</div> */}
              </div>
            </OverlayPortal>
        </div>
        
      )}
    </div>
  );
}

export default UtilityTopBar;
