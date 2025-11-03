import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../../ContentsCarousel.module.css';

const CarouselNavigation = ({ direction, onClick, isVisible, className }) => {
  return (
    <div
      className={styles.NavigationContainer}
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <button
        className={`${styles.NavigationContainer} ${className}`}
        onClick={onClick}
      >
        {direction === 'prev' ? (
          <ChevronLeft className={styles.NavigationIcon} aria-label="Previous slide" />
        ) : (
          <ChevronRight className={styles.NavigationIcon} aria-label="Next slide" />
        )}
      </button>
    </div>
  );
};

export default CarouselNavigation;