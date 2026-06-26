import React, { useContext, useState } from "react";
import { ProfileIcon} from "@utils/dispatchers/Icons";
import { UserContext } from '@context/user-context/UserContext';
import styles from "./OpenUserDropdown.module.css";

const OpenUserDropdown = ({ onClick }) => {
  const { profileImage } = useContext(UserContext);  
  const [imageError, setImageError] = useState(false);
  return (
    <div className={styles.Container} onClick={onClick}>
      {profileImage && !imageError ? (
        <img 
          src={profileImage} 
          alt="Profile" 
          className={styles.ProfileImg} 
          draggable="false" 
          onError={() => setImageError(true)}
        />
      ) : (
        <ProfileIcon className={styles.ProfileImg} />
      )}
    </div>
  );
};

export default OpenUserDropdown;
