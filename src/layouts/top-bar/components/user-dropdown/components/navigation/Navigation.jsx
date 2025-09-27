import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navigation.module.css';

const isExternal = (url) => /^https?:\/\//.test(url);

const Navigation = ({ to, icon, label, onClick, onNavigate  }) => {
  const location = useLocation();
  const isSelected = to && !isExternal(to) && location.pathname === to;

  const content = (
    <>
      <div>
        {typeof icon === 'string' ? (
          <img src={icon} alt={`Logo ${label}`} className={styles.LogoImg} draggable="false" />
        ) : (
          React.isValidElement(icon) ? React.cloneElement(icon, { className: styles.Logo }) : icon
        )}
      </div>
      <p className={styles.Label}>{label}</p>
    </>
  );
  const handleClick = (e) => {
    if (onClick) {
      onClick();
    }
    if (onNavigate) {
      onNavigate();
    }
  };
  if (to) {
    if (isExternal(to)) {
      return (
        <div className={styles.OngletBox}>
          <a href={to} target="_blank" rel="noopener noreferrer" className={styles.Link}>
            {content}
          </a>
        </div>
      );
    } else {
      return (
        <div className={`${styles.OngletBox} ${isSelected ? styles.OngletBoxSelect : ''}`}>
          <Link to={to} className={styles.Link} onClick={handleClick}>
            {content}
          </Link>
        </div>
      );
    }
  } else {
    return (
      <div className={styles.OngletBoxClick} onClick={onClick}>
        {content}
      </div>
    );
  }
};

export default Navigation;
