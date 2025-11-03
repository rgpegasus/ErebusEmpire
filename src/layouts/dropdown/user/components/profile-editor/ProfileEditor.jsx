import React, { useState, useContext } from 'react';
import { ProfileIcon, SmallErebusIcon } from '@utils/dispatchers/Icons';
import { UserContext } from '@context/user-context/UserContext';
import EditImg from './components/edit-img/EditImg';
import styles from './ProfileEditor.module.css';

function ProfileEditor({ editMode, setEditMode, setIsCropping }) {
  const { username, profileImage, updateUser } = useContext(UserContext);
  const [imageSrc, setImageSrc] = useState(null);        
  const [tempUsername, setTempUsername] = useState(username);  
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const handleProfileClick = () => {
    if (editMode) {
      setShowOptions(!showOptions);
      setIsCropping(false)
    }
  };

  const onFileChange = (e) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setIsCropping(true)
      };
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = null;
    }
  };

  const handleSaveCropped = (img) => {
    updateUser(username, img);
    setImageSrc(null);
    setIsCropping(false);
  };

  const resetProfilePhoto = () => {
    updateUser(username, null);
    setShowOptions(false);
  };

  const handleUsernameChange = (e) => {
    setTempUsername(e.target.value);
  };

  const validateUsername = () => {
    const trimmed = tempUsername.trim();
    const finalName = trimmed === "" ? "User" : trimmed;
    setTempUsername(finalName); 
    updateUser(finalName, profileImage); 
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateUsername();
    }
  };

  return (
    <div className={styles.ProfileEditorContainer}>
      <div className={styles.ProfileEditor}>
        <div onClick={handleProfileClick}>
          {profileImage
            ? <img src={profileImage} alt="Profil" className={`${styles.ProfileImg} ${editMode ? styles.editable : ''}`} draggable="false" />
            : <ProfileIcon className={`${styles.ProfileImg} ${editMode ? styles.editable : ''}`} />
          }

          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className={styles.InputEdit}
            id="upload"
          />

          {editMode && showOptions && (
            <div className={styles.EditContainer}>
              <label htmlFor="upload" onClick={() => document.getElementById('upload').click()} className={styles.EditOption}>
                Modifier l’image
              </label>
              <button className={styles.EditOption} onClick={resetProfilePhoto}>Supprimer l’image</button>
            </div>
          )}
        </div>

        <div className={styles.NameContainer}>
          <div className={styles.ProfileName} onClick={() => editMode && setIsEditingName(true)}>
            {isEditingName ? (
              <input
                className={styles.InputName}
                type="text"
                maxLength="16"
                value={tempUsername}
                onChange={handleUsernameChange}
                placeholder="Entrez un pseudo"
                onKeyDown={handleNameKeyDown}
                onBlur={validateUsername}
                autoFocus
              />
            ) : ( 
              <div className={`${styles.ProfileName} ${editMode ? styles.editable : ''}`}>{username}</div>
            )}
          </div>

          <div className={styles.AppContainer}>
            <SmallErebusIcon className={styles.AppLogo} />
            <h1 className={styles.AppTitle}>Erebus Empire</h1>
          </div>
        </div>
      </div>

      <div className={styles.EditContainerButton}>
        <span className={styles.EditButton} onClick={() => setEditMode(prev => !prev)}>
          {editMode ? '✖' : '✎'}
        </span>
      </div>
      {imageSrc && (
          <EditImg
            imageSrc={imageSrc}
            setImageSrc={setImageSrc}
            crop={crop}
            setCrop={setCrop}
            zoom={zoom}
            setZoom={setZoom}
            onSave={handleSaveCropped}
            setIsCropping={setIsCropping}
          />
        )
      }
    </div>
  );
}

export default ProfileEditor;
