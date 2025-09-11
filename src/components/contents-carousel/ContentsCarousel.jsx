import React, { useRef, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectCoverflow, Keyboard } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EpisodeTitle from '@components/scroll-title';
import ImgLoader from '../img-loader/ImgLoader';
import { toSlug } from '@utils/functions/toSlug'

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
}) => {
  const swiperRef = useRef(null);
  const [shiftPressed, setShiftPressed] = useState(false);

  useEffect(() => {
    if (!enableShiftDelete) return;
    const handleDown = (e) => {
      if (e.key === 'Shift') setShiftPressed(true);
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
  }, [enableShiftDelete]);

  const handleClick = (episode, e) => {
    if (enableShiftDelete && e.shiftKey) {
      onDeleteEpisode(episode);
      return;
    }
    onClickEpisode(episode, e);
  };

  return (
    <div>
      {title && <div className="CategorieTitle">{title}</div>}
      {data.length > 0 ? (
        <div className="LatestEpisodes">
          <div className="Button-navigation" style={{ left: 0 }}>
              <div className={`Button-navigation prev-${toSlug(title)}`}>
                <ChevronLeft className='Button-navigation-logo' aria-label="Previous slide" />
              </div>
          </div>
          <div className="LatestEpisodes-wrapper">
            <Swiper
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              modules={[Navigation, EffectCoverflow, Keyboard]}
              navigation={{
                prevEl: `.prev-${toSlug(title)}`,
                nextEl: `.next-${toSlug(title)}`
              }}
              keyboard={{ enabled: true }}
              effect="coverflow"
              grabCursor
              initialSlide={2}
              centeredSlides
              slidesPerView={5}
              coverflowEffect={{ rotate: 20, slideShadows: false }}
              className="LatestEpisodes-container"
            >
              {data.map((episode, index) => (
                <SwiperSlide key={index}>
                  <div
                    className={`LatestEpisodes-item ${enableShiftDelete && shiftPressed ? 'shift-delete' : ''}`}
                    onClick={(e) => handleClick(episode, e)}
                  >
                    <div className="LatestEpisodes-cover">
                      <h3>{getEpisodeTitle(episode)}</h3>
                      <div className="LatestEpisodes-ImgContainer">
                        <ImgLoader src={getEpisodeCover(episode)} key={`${getEpisodeTitle(episode)} - ${getEpisodeSubTitle(episode)}`} />
                      </div>
                    </div>
                    <div className="LatestEpisodes-info">
                      <EpisodeTitle title={getEpisodeSubTitle(episode)} />
                      <div className="Separation"></div>
                      <p>{episode[availableLanguageKey]}</p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <div className="Button-navigation" style={{ right: 0 }}>
            <div className={`Button-navigation next-${toSlug(title)}`} >
              <ChevronRight className='Button-navigation-logo' aria-label="Next slide"/>
            </div>
          </div>
        </div>
      ) : (
        <div className="AFK">
          <p>Aucun épisode disponible</p>
        </div>
      )}
    </div>
  );
};

export default ContentsCarousel;
