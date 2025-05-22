import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EpisodeTitle from './scroll-title';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectCoverflow, Keyboard } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

const WatchHistory = () => {
  const [watchedEpisodes, setWatchedEpisodes] = useState([]);
  const [shiftPressed, setShiftPressed] = useState(false);
  const navigate = useNavigate();
const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [isInside, setIsInside] = useState(false);
const containerRef = useRef(null);

  useEffect(() => {
    // Ce timeout est crucial pour que swiper trouve bien les refs après le rendu
    setTimeout(() => {
      if (swiperRef.current) {
        swiperRef.current.params.navigation.prevEl = prevRef.current;
        swiperRef.current.params.navigation.nextEl = nextRef.current;
        swiperRef.current.navigation.destroy();
        swiperRef.current.navigation.init();
        swiperRef.current.navigation.update();
      }
    });
  }, []);

  const swiperRef = React.useRef(null);

useEffect(() => {
  loadWatchedEpisodes();
  const handleKeyDown = (e) => {
    if (e.key === 'Shift' && isInside) {
      setShiftPressed(true);
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === 'Shift') {
      setShiftPressed(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, [isInside]);


  const loadWatchedEpisodes = () => {
    const history = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('lastWatched_')) {
        const raw = localStorage.getItem(key);
        try {
          const parsed = JSON.parse(raw);
          history.push({ ...parsed, key });
        } catch (e) {
          console.error(`Erreur parsing historique pour ${key}`, e);
        }
      }
    }

    history.sort((a, b) => b.timestamp - a.timestamp);
    setWatchedEpisodes(history);
  };

  const handleEpisodeClick = (episode, event) => {
    if (event.shiftKey) {
      localStorage.removeItem(episode.key);
      setWatchedEpisodes((prev) =>
        prev.filter((ep) => ep.key !== episode.key)
      );
      return;
    }

    const [animeId, seasonId] = episode.key.split('_');
    const episodeId = episode.episodeTitle
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    navigate(`/erebus-empire/anime/${animeId}/${seasonId}/${episodeId}`, {
      
      state: {
        url: episode.url,
        host: episode.host,
        episodeTitle: episode.episodeTitle,
        episodes: episode.episodes,
        animeId: episode.animeId, 
        seasonId: episode.seasonId,
        animeTitle: episode.animeTitle,
        seasonTitle: episode.seasonTitle,
        animeCover: episode.animeCover,
      },
    });
  };

   return (
    <div>
      {watchedEpisodes.length > 0 && (
        <div>
          <div className="CategorieTitle">Reprendre la lecture :</div>
          <div className="LatestEpisodes"
          ref={containerRef}
          onMouseEnter={() => setIsInside(true)}
          onMouseLeave={() => setIsInside(false)}
          >
            
            <button
              ref={prevRef}
              className="Button-navigation"
              style={{
                left: 0,
              }}
              aria-label="Previous slide"
            >
            <ChevronLeft size={50} color="#996e35" />
            </button>
            <div className="LatestEpisodes-wrapper">
              <Swiper
                onSwiper={(swiper) => (swiperRef.current = swiper)} 
                modules={[Navigation, EffectCoverflow, Keyboard]}
                navigation={{
                  prevEl: prevRef.current,
                  nextEl: nextRef.current,
                }}
                initialSlide={2}
                keyboard={{ enabled: true }}
                effect="coverflow"
                grabCursor
                centeredSlides
                slidesPerView={5}
                coverflowEffect={{
                  rotate: 20,
                  slideShadows: false,
                }}
                className="LatestEpisodes-container"
              >
                {watchedEpisodes.map((episode, index) => (
                  <SwiperSlide key={episode.key || index}>
                    <div
                      className={`LatestEpisodes-item ${shiftPressed ? 'shift-delete' : ''}`}
                      onClick={(e) => handleEpisodeClick(episode, e)}
                    >
                      <div className="LatestEpisodes-cover">
                        <h3>{episode.animeTitle}</h3>
                        <img
                          src={episode.animeCover}
                          draggable="false"
                          alt={episode.episodeTitle}
                          className="EpisodeCover"
                        />
                      
                      </div>
                      <div className="LatestEpisodes-info">
                        <EpisodeTitle title={`${episode.seasonTitle} ${episode.episodeTitle}`} />
                        <div className="Separation"></div>
                        <p>VOSTFR</p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <button
              ref={nextRef}
              className="Button-navigation"
              style={{
                right: 0,
              }}
              aria-label="Next slide"
            >
              <ChevronRight size={50} color="#996e35" />
            </button>
          </div>
          <div className='Space'></div><div className='Space'></div>
        </div>
      )}
    </div>
  );
};

export default WatchHistory;
