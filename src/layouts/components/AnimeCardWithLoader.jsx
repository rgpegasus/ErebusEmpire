import React, { useState } from 'react';
import { ErebusIcon } from '@utils/PictureDispatcher';

function AnimeCardWithLoader({ anime, onClick }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="anime-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      {!loaded && (
        <div className="ImageLoader"/>
      )}
      <img
        draggable="false"
        src={anime.cover || ErebusIcon}
        alt={`Bannière de ${anime.title}`}
        className={`cover-img ${loaded ? 'loaded' : 'hidden'}`}
        onLoad={() => setLoaded(true)}
      />
      <div>
        <h3>{anime.title}</h3>
        <h4>{anime.altTitles?.[0] || ''}</h4>
      </div>
    </div>
  );
}

export default AnimeCardWithLoader;
