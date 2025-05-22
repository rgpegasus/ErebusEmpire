import React, { useRef, useEffect, useState } from 'react';
import {useNavigate } from 'react-router-dom';
import EpisodeTitle from '@components/scroll-title';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectCoverflow, Keyboard } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import { toSlug } from '@utils/toSlug'


const LatestEpisodes = ({ episodes }) => {
  const navigate = useNavigate();
const prevRef = useRef(null);
  const nextRef = useRef(null);
 
  useEffect(() => {
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


  const parseEpisodeNumbers = (str) => {
    const lower = str.toLowerCase();
    const episodeMatch = lower.match(/e(pisode)?\s*(\d+)/i); 
    const episodeNumber = episodeMatch ? episodeMatch[2] : null;
    return { episodeNumber };
  };
  
  const buildErebusPathFromRecentAnime = async (anime) => {
    const { url: animeUrl, episode } = anime;
    const animeId = animeUrl.split("/").slice(4, 5).join("/");
    const seasonId = animeUrl.split("/").slice(5, 6).join("/");
    let embedData = [];
    let seasonTitle = "null"; 
    try {
      const data = await window.electron.ipcRenderer.invoke('get-episodes', animeUrl, true);
      const { animeInfo, episodes } = data;
      embedData = episodes
      seasonTitle = animeInfo.seasonTitle
    } catch (err) {
      console.error("Erreur récupération embed:", err);
    }
    if (!embedData || embedData.length === 0) return null;
  
    const { episodeNumber } = parseEpisodeNumbers(episode);
    const episodeInfo = episode.toLowerCase();
  
    let typeToSearch = 'episode';
    if (episodeInfo.includes('oav') || episodeInfo.includes('ova')) typeToSearch = 'oav';
    else if (episodeInfo.includes('film')) typeToSearch = 'film';
    else if (episodeInfo.includes('spécial') || episodeInfo.includes('special')) typeToSearch = 'special';
  
    let matchedEmbed = null;
  
    matchedEmbed = embedData.find(e => toSlug(e.title) === toSlug(episode));
  
    if (!matchedEmbed && episodeNumber) {
      matchedEmbed = embedData.find(e => {
        const title = e.title.toLowerCase();
        return title.includes(typeToSearch) && title.match(/e(pisode)?\s*(\d+)/i)?.[2] === episodeNumber;
      });
    }
  
    if (!matchedEmbed && episodeNumber) {
      matchedEmbed = embedData.find(e => {
        const title = e.title.toLowerCase();
        const match = title.match(/e(pisode)?\s*(\d+)/i);
        return title.includes(typeToSearch) && match && match[2] === episodeNumber;
      });
    }
    
  
    if (!matchedEmbed) {
      matchedEmbed = embedData.find(e => toSlug(e.title).includes(toSlug(episode)) || toSlug(episode).includes(toSlug(e.title)));
    }

    if (!matchedEmbed) {
      matchedEmbed = embedData[0];
    }
  
    const episodeSlug = matchedEmbed ? toSlug(matchedEmbed.title) : null;
    const finalPath = episodeSlug
      ? `/erebus-empire/anime/${animeId}/${seasonId}/${episodeSlug}`
      : `/erebus-empire/anime/${animeId}/${seasonId}`;
  
    return {
      path: finalPath,
      embedData,
      matchedEmbed,
      animeId,
      seasonId, 
      seasonTitle,
    };
  };
  
  
  const handleEpisodeClick = async (episode) => {
    try {
      const { path, matchedEmbed, embedData, animeId, seasonId, seasonTitle} = await buildErebusPathFromRecentAnime(episode);
      if (path) {
        navigate(path, {
          state: {
            url: matchedEmbed.url,
            host:matchedEmbed.host,
            episodeTitle: matchedEmbed.title,
            episodes: embedData,
            animeId,
            seasonId,
            animeTitle: episode.title,
            seasonTitle,
            animeCover:episode.cover
          },
        });
      }
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