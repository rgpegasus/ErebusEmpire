import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ErebusIconTitle } from '@utils/dispatchers/Icons';
import styles from './LogoErebus.module.css';

const LogoErebus = () => {
  const navigate = useNavigate();
  return (
    <div onClick={()=>navigate("/erebus-empire/home")}>
      <ErebusIconTitle 
        className={styles.Logo}
      />
    </div>
  );
};

export default LogoErebus;
