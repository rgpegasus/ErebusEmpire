import React, { useEffect, useRef, useState } from 'react';

const SCROLL_SPEED = 100; // pixels par seconde

const EpisodeTitle = ({ title }) => {
  const titleRef = useRef(null);
  const wrapperRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [scrollDuration, setScrollDuration] = useState(0);

  useEffect(() => {
    const el = titleRef.current;
    const wrapper = wrapperRef.current;

    if (el && wrapper) {
      const isOverflowing = el.scrollWidth > wrapper.clientWidth;
      setShouldScroll(isOverflowing);

      if (isOverflowing) {
        const distance = el.scrollWidth - wrapper.clientWidth;
        setScrollDistance(distance); 
        setScrollDuration(distance / SCROLL_SPEED); // durée en secondes
      }
    }
  }, [title]);

  return (
    <div
      className={`LatestEpisodes-title-wrapper ${shouldScroll ? 'scrollable' : ''}`}
      ref={wrapperRef}
    >
      <h2
        ref={titleRef}
        className={shouldScroll ? 'scrollable-title' : ''}
        style={
          shouldScroll
            ? {
                '--scroll-distance': `-${scrollDistance}px`,
                '--scroll-duration': `${scrollDuration}s`
              }
            : {}
        }
      >
        {title}
      </h2>
    </div>
  );
};

export default EpisodeTitle;
