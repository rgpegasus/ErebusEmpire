import React, { useState } from 'react';
import { ErebusIcon } from '@utils/dispatchers/Pictures';
import styles from './ImgLoader.module.css';

function ImgLoader({ anime, src }) {
  const [loaded, setLoaded] = useState(false);
  

  return (
    <div className={styles.Container}>
      {!loaded && <div className={styles.ImageLoader} />}
      
      <img
        draggable="false"
        src={src? src : anime.cover || anime.animeCover || ErebusIcon}
        alt={`Bannière de ${anime?.title}`}
        className={`${styles.Cover} ${loaded ? styles.loaded : styles.hidden}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export default ImgLoader;
