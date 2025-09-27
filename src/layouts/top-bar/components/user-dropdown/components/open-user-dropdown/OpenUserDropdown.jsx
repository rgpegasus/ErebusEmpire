import React, { useContext } from "react";
import { ProfileIcon, DownArrowIcon} from "@utils/dispatchers/Icons";
import { UserContext } from '@context/user-context/UserContext';
import styles from "./OpenUserDropdown.module.css";

const OpenUserDropdown = ({ onClick }) => {
  const { profileImage } = useContext(UserContext);  
  
  return (
    <div className={styles.Container} onClick={onClick}>
      {profileImage ? (
        <img src={profileImage} alt="Profile" className={styles.ProfileImg} draggable="false" />
      ) : (
        <ProfileIcon className={styles.ProfileImg} />
      )}
      <DownArrowIcon className={styles.Arrow} />
    </div>
  );
};

export default OpenUserDropdown;
