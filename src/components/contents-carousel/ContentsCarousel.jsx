import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ScrollTitle from '@components/scroll-title/ScrollTitle';
import ImgLoader from '../img-loader/ImgLoader';
import { toSlug } from '@utils/functions/toSlug';
import styles from './ContentsCarousel.module.css';

const ContentsCarousel = ({
  data = [],
  onClickEpisode,
  onDeleteEpisode = () => {},
  getEpisodeCover,
  getEpisodeTitle,
  getEpisodeSubTitle,
  availableLanguageKey = 'language',
  title = '',
  enableShiftDelete = false,
  display = true,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'center',
    skipSnaps: false,
    containScroll: 'trimSnaps',
    dragFree: true,

  });

  const [isInside, setIsInside] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
const [activeIndex, setActiveIndex] = useState(0);

useEffect(() => {
  if (!emblaApi) return;

  const onSelect = () => {
    setActiveIndex(emblaApi.selectedScrollSnap());
  };

  emblaApi.on('select', onSelect);
  onSelect(); // initialisation

  return () => emblaApi.off('select', onSelect);
}, [emblaApi]);

  // Gestion Shift pour suppression
  useEffect(() => {
    if (!enableShiftDelete) return;
    const handleDown = (e) => {
      if (e.key === 'Shift' && isInside) setShiftPressed(true);
    };
    const handleUp = (e) => {
      if (e.key === 'Shift') setShiftPressed(false);
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [enableShiftDelete, isInside]);

  const handleClick = (episode, e) => {
    if (enableShiftDelete && e.shiftKey) {
      onDeleteEpisode(episode);
      return;
    }
    onClickEpisode(episode, e);
  };

  // Navigation Embla
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
const [canScrollPrev, setCanScrollPrev] = useState(false);
const [canScrollNext, setCanScrollNext] = useState(false);

useEffect(() => {
  if (!emblaApi) return;

  const onSelect = () => {
    setActiveIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  };

  emblaApi.on('select', onSelect);
  onSelect(); // initialisation

  return () => emblaApi.off('select', onSelect);
}, [emblaApi]);

  if (data.length === 0 && !display) {
    return null;
  }
  

  return (
    <div>
      {title && <div className={styles.CarouselTitle}>{title}</div>}
      {data.length > 0 ? (
        <div
          className={styles.CarouselContainer}
          onMouseEnter={() => setIsInside(true)}
          onMouseLeave={() => setIsInside(false)}
        >
          {/* Bouton gauche */}
<div
  className={styles.NavigationContainer}
  style={{
    left: 0,
    opacity: canScrollPrev ? 1 : 0,
    pointerEvents: canScrollPrev ? 'auto' : 'none',
    transition: 'opacity 0.3s ease',
  }}
>
  <button
    className={`${styles.NavigationContainer} prev-${toSlug(title)}`}
    onClick={scrollPrev}
  >
    <ChevronLeft className={styles.NavigationIcon} aria-label="Previous slide" />
  </button>
</div>

          {/* Carousel */}
          <div className={styles.ContentsWrapper} ref={emblaRef}>
            <div className={styles.ContentsContainer}>
              {data.map((episode, index) => (
                <div className={`${styles.emblaSlide} ${index === activeIndex ? styles.activeSlide : ''}`} key={index}>
                  <div
                    className={`${styles.Item} ${enableShiftDelete && shiftPressed && styles.ShiftDelete}`}
                    onClick={(e) => handleClick(episode, e)}
                  >
                    <div className={styles.Cover}>
                      <h3 className={styles.CoverTitle}>{getEpisodeTitle(episode)}</h3>
                      <div className={styles.CoverContainer}>
                        <ImgLoader
                          src={getEpisodeCover(episode)}
                          key={`${getEpisodeTitle(episode)} - ${getEpisodeSubTitle(episode)}`}
                        />
                      </div>
                    </div>
                    <div className={styles.Information}>
                      <ScrollTitle title={getEpisodeSubTitle(episode)} />
                      <div className={styles.Separation}></div>
                      <p className={styles.Language}>{episode[availableLanguageKey]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
  className={styles.NavigationContainer}
  style={{
    right: 0,
    opacity: canScrollNext ? 1 : 0,
    pointerEvents: canScrollNext ? 'auto' : 'none',
    transition: 'opacity 0.3s ease',
  }}
>
  <button
    className={`${styles.NavigationContainer} next-${toSlug(title)}`}
    onClick={scrollNext}
  >
    <ChevronRight className={styles.NavigationIcon} aria-label="Next slide" />
  </button>
</div>
        </div>
      ) : (
        <div className={styles.ResultNone}>
          <p className={styles.ResultNoneMessage}>Aucun épisode disponible</p>
        </div>
      )}
    </div>
  );
};

export default ContentsCarousel;
