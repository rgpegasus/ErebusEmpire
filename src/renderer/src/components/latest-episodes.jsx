import React from 'react';
import { useNavigate } from 'react-router-dom';
import EpisodeTitle from './scroll-title';

const LatestEpisodes = ({ episodes }) => {
  const navigate = useNavigate();

  const toSlug = (name) => {
    return name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const buildErebusPathFromRecentAnime = async (anime) => {
    const { title, url: animeUrl, episode } = anime;
    const animeUrlBase = animeUrl.split("/").slice(0, 5).join("/") + "/";

    const seasons = await window.electron.ipcRenderer.invoke('get-seasons', animeUrlBase);
    const matchingSeason = seasons.find(s => s.url.replace(/\/$/, "") === animeUrl.replace(/\/$/, ""));
    const seasonId = matchingSeason ? toSlug(matchingSeason.title) : null;
    if (!seasonId) return null;

    const animeId = animeUrl.split("/catalogue/")[1].split("/")[0];
    let embedData = [];
    try {
      embedData = await window.electron.ipcRenderer.invoke('get-episodes', animeUrl); 
    } catch (err) {
      console.error("Erreur récupération embed:", err);
    }

    const episodeMatch = episode.match(/Episode\s+(\d+(?:\.\d+)?)/i);
    const episodeId = episodeMatch ? episodeMatch[1] : null;
    let matchedEmbed = null;
    if (episodeId && embedData.length > 0) {
      matchedEmbed = embedData.find(e =>
        e.title.includes(episodeId) ||
        e.title.toLowerCase().includes(episode.toLowerCase())
      );
    }
    
    const episodeSlug = matchedEmbed
      ? toSlug(matchedEmbed.title)
      : toSlug(embedData[0].title);

    const finalPath = episodeSlug
      ? `/erebus-empire/anime/${animeId}/${seasonId}/${episodeSlug}`
      : `/erebus-empire/anime/${animeId}/${seasonId}`;
    
    return {
      path: finalPath,
      embedData,  
      matchedEmbed: matchedEmbed || embedData[0],
      animeId,
      seasonId,
      matchingSeason,
    };
  };

  const handleEpisodeClick = async (episode) => {
    try {
      const { path, matchedEmbed, embedData, animeId, seasonId, matchingSeason } = await buildErebusPathFromRecentAnime(episode);
      if (path) {
        navigate(path, {
          state: {
            url: matchedEmbed.url,
            episodeTitle: matchedEmbed.title,
            episodes: embedData,
            animeId,
            seasonId,
            animeTitle: episode.title,
            seasonTitle: matchingSeason.title,
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
          {episodes.map((episode) => (
            <div
              key={episode.id || episode.title}
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
          ))}
        </div>
      ) : (
        <p>Aucun épisode disponible</p>
      )}
    </div>
  );
};

export default LatestEpisodes;
