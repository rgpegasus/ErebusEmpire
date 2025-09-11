import React, { useContext } from "react";
import { UserContext } from '@context/user-context/UserContext';
import { ProfilIcon } from "@utils/dispatchers/Icons";
import { ChevronDown } from "lucide-react";
import styles from "./OpenUserDropdown.module.css";

const OpenUserDropdown = ({ onClick }) => {
  const { profileImage } = useContext(UserContext);  
  
  return (
    <div className={styles.Container} onClick={onClick}>
      {profileImage ? (
        <img src={profileImage} alt="Profil" className={styles.ProfileImg} draggable="false" />
      ) : (
        <ProfilIcon className={styles.ProfileImg} />
      )}
      <ChevronDown className={styles.Arrow} />
    </div>
  );
};

export default OpenUserDropdown;
