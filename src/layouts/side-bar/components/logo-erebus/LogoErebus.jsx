import React, { useEffect, useState } from 'react';
import { DarkErebusIcon, LightErebusIcon } from '@utils/dispatchers/Pictures';
import styles from './LogoErebus.module.css';

const LogoErebus = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = localStorage.getItem('theme') || 'dark';
      setTheme(newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const logoSrc = theme === 'dark' ? DarkErebusIcon : LightErebusIcon;

  return (
    <div className={styles.Logo}>
        <img src={logoSrc} alt="Logo" draggable="false" />
    </div>
  );
};

export default LogoErebus;
