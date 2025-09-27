import React from 'react';
import { ErebusIconTitle } from '@utils/dispatchers/Icons';
import styles from './LogoErebus.module.css';

const LogoErebus = () => {
  return (
    <div className={styles.Logo}>
      <ErebusIconTitle 
        className={styles.LogoSvg}
      />
    </div>
  );
};

export default LogoErebus;
