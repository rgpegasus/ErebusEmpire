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
  const containerRef = useRef(null);
  const swiperRef = useRef(null);
  const [isInside, setIsInside] = useState(false);

  useEffect(() => {
    loadWatchedEpisodes();

    const handleKeyDown = (e) => {
      if (e.key === 'Shift' && isInside) setShiftPressed(true);
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Shift') setShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isInside]);

  const loadWatchedEpisodes = async () => {
    const all = await animeWatchHistory.loadAll(); 
    console.log(all)
    if (!all) return;

    const episodes = Object.entries(all).map(([key, data]) => ({ key, ...data }));
    episodes.sort((a, b) => b.timestamp - a.timestamp);
    setWatchedEpisodes(episodes);
  };

  const deleteEpisode = async (episode) => {
    await animeWatchHistory.delete(episode.key);
    const all = await animeWatchHistory.loadAll();
    if (Object.keys(all).length === 0) {
      setWatchedEpisodes([]);
    } else {
      setWatchedEpisodes((prev) => prev.filter((ep) => ep.key !== episode.key));
    }
  };

  const fetchEpisodes = async (episode) => {
    try {
      return await window.electron.ipcRenderer.invoke('get-episodes', episode.seasonUrl);
    } catch (error) {
      console.error("Erreur lors de la récupération des épisodes :", error);
    }
  }; 

const handleEpisodeClick = async (episode, event) => {
  const episodes = await fetchEpisodes(episode);  
  console.log("caca", episodes);

  if (event.shiftKey) {
    deleteEpisode(episode);
    return;
  }

  const episodeId = episode.episodeTitle
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  navigate(`/erebus-empire/anime/${episode.animeId}/${episode.seasonId}/${episodeId}`, {
    state: {
      url: episode.url,
      host: episode.host,
      episodeTitle: episode.episodeTitle,
      episodes,  
      animeId: episode.animeId,
      seasonId: episode.seasonId,
      animeTitle: episode.animeTitle,
      seasonTitle: episode.seasonTitle,
      animeCover: episode.animeCover,
      seasonUrl: episode.seasonUrl
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
