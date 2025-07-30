import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EpisodeTitle from '@components/scroll-title';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectCoverflow, Keyboard } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import { getRealEpisodeName } from '@utils/getRealEpisodeName'
import { useLoader } from '@utils/PageDispatcher';


const LatestEpisodes = ({ episodes }) => {
  const navigate = useNavigate();
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const { setLoading } = useLoader();


  const swiperRef = React.useRef(null);

  
  const handleEpisodeClick = async (episode) => {
    try {
      setLoading(true)
      const { path, matchedEmbed, embedData, animeId, seasonId, seasonTitle} = await getRealEpisodeName(episode);
      const episodes = {[episode.language]: embedData};
      if (path) {
        navigate(path, {
          state: {
            episodeTitle: matchedEmbed.title,
            episodes: episodes,
            animeId,
            seasonId,
            animeTitle: episode.title,
            seasonTitle,
            animeCover:episode.cover,
            seasonUrl:episode.url,
            availableLanguages:[episode.language],
            selectedLanguage:episode.language
          },
        });
      }
      setLoading(false)
    } catch (err) {
      console.error("Erreur lors de la navigation :", err);
    }
  };

  return (
    <div>
      <div className="CategorieTitle">Derniers épisodes sortis :</div>
      {episodes.length > 0 ? (
        <div className="LatestEpisodes">
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
                keyboard={{ enabled: true }}
                effect="coverflow"
                grabCursor
                initialSlide={2}
                centeredSlides
                slidesPerView={5}
                coverflowEffect={{
                  rotate: 20,
                  slideShadows: false,
                }}
                className="LatestEpisodes-container"
              >
              {episodes.map((episode) => (
                <SwiperSlide key={episode.id || episode.title}>
                  <div
                    className="LatestEpisodes-item"
                    onClick={() => handleEpisodeClick(episode)}
                  >
                    <div className="LatestEpisodes-cover">
                      <h3>{episode.title}</h3>
                      <img
                        src={episode.cover}
                        draggable="false"
                        alt={episode.title}
                        className="EpisodeCover"
                      />
                    </div>
                    <div className='LatestEpisodes-info'>
                      <EpisodeTitle title={episode.episode} />
                      <div className='Separation'></div>
                      <p>{episode.language}</p>
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
      ) : (
        <div className="AFK">
          <p>Aucun épisode disponible</p>
        </div>
      )}
    </div>
  );
};

export default LatestEpisodes;