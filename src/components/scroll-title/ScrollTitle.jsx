import React, { useEffect, useRef, useState } from 'react';
import styles from './ScrollTitle.module.css';

const SCROLL_SPEED = 100; // px/sec

const ScrollTitle = ({ title }) => {
  const titleRef = useRef(null);
  const wrapperRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [scrollDuration, setScrollDuration] = useState(0);

useEffect(() => {
  const el = titleRef.current;
  const wrapper = wrapperRef.current;

  if (el && wrapper) {
    requestAnimationFrame(() => {
      const distance = el.scrollWidth - wrapper.clientWidth;
      if (distance > 0) {
        setShouldScroll(true);
        setScrollDistance(distance);
        setScrollDuration(distance / SCROLL_SPEED);
      } else {
        setShouldScroll(false);
      }
    });
  }
}, [title]);


  return (
    <div
      className={`${styles.Container} ${shouldScroll ? styles.Scrollable : styles.Centered}`}
      ref={wrapperRef}
    >
      <h2
        ref={titleRef}
        className={`${styles.Title} ${shouldScroll ? styles.ScrollableTitle : ''}`}
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

export default ScrollTitle;
