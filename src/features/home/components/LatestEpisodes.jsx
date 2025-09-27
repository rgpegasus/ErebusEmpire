import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getRealEpisodeName } from '@utils/functions/getRealEpisodeName'
import { useLoader } from '@utils/dispatchers/Page';
import ContentsCarousel from '@components/contents-carousel/ContentsCarousel';


const LatestEpisodes = ({ episodes }) => {
  const navigate = useNavigate();
  const { setLoading } = useLoader();

  
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
    <ContentsCarousel
      data={episodes}
      title="Derniers épisodes sortis :"
      availableLanguageKey="language"
      onClickEpisode={handleEpisodeClick}
      getEpisodeCover={(ep) => ep.cover}
      getEpisodeTitle={(ep) => ep.title}
      getEpisodeSubTitle={(ep) => ep.episode}
    />
  );
};

export default LatestEpisodes;