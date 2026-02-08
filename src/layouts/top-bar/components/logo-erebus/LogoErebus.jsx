import React from 'react';
import { useNavigate, useLocation } from "react-router-dom"
import { ErebusIconTitle } from '@utils/dispatchers/Icons';
import styles from './LogoErebus.module.css';

const LogoErebus = () => {
  const navigate = useNavigate();
  const location = useLocation()
  return (
    <div onClick={()=>{location.pathname != "/erebus-empire/home" ? navigate("/erebus-empire/home") : {}}}>
      <ErebusIconTitle 
        className={styles.Logo}
      />
    </div>
  );
};

export default LogoErebus;
