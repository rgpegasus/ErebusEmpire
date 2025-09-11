import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navigation.module.css';

const Navigation = ({ to, icon, label }) => {
  const location = useLocation();
  const isSelected = location.pathname === to;

  return (
    <div className={`${styles.OngletBox} ${isSelected ? styles.OngletBoxSelect : ''}`}>
      <Link to={to} className={styles.Link}>
        <div>
          {typeof icon === 'string' ? (
            <img src={icon} alt={`Logo ${label}`} className={styles.LogoImg} draggable="false" />
          ) : (
            React.cloneElement(icon, { className: styles.Logo })
          )}
        </div>
        <p className={styles.Label}>{label}</p>
      </Link>
    </div>
  );
};

export default Navigation;
