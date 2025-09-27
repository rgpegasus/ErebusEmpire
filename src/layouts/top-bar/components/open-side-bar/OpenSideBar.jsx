import React, { useState, useEffect, useRef } from 'react';
import { ErebusIcon } from '@utils/dispatchers/Icons'
import styles from './OpenSideBar.module.css';

const OpenSideBar = () => {
const [windowWidth, setWindowWidth] = useState(window.innerWidth);
const toggleWidth = 1920;
const menuRef = useRef(null); 

useEffect(() => {
const handleClickOutside = (event) => {
    setTimeout(() => {
        const target = event.target;
        if (windowWidth <= toggleWidth && menuRef.current && !menuRef.current.contains(target)) {
            const body = document.body;
            body.classList.remove('menu-extended');
            body.classList.add('menu-compact');
        }
    }, 0);
}; 

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
}, [windowWidth]);


useEffect(() => {
    const handleResize = () => {
        const newWidth = window.innerWidth;
        setWindowWidth(newWidth);
        const body = document.body;
  
        if (newWidth <= toggleWidth) {
            body.classList.remove('menu-extended');
            body.classList.add('menu-compact');
        } else {
            body.classList.remove('menu-compact');
            body.classList.remove('menu-extended');
        }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []);

const toggleMenu = () => {
    if (windowWidth > toggleWidth) return;
    const body = document.body;
    body.classList.toggle('menu-compact');
    body.classList.toggle('menu-extended');
}
return (
    <div ref={menuRef}>
        {windowWidth <= toggleWidth && (
            <ErebusIcon 
                onClick={toggleMenu} 
                className={styles.Logo} 
            />
        )}
    </div>
  );
};

export default OpenSideBar;
