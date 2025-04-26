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
  const cleanString = (str) => 
    str.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  const parseSeasonEpisodeNumbers = (str) => {
    const lower = str.toLowerCase();
    const seasonMatch = lower.match(/s(?:aison)?\s*(\d+)/i); 
    const episodeMatch = lower.match(/e(pisode)?\s*(\d+)/i); 
    const seasonNumber = seasonMatch ? seasonMatch[1] : null;
    const episodeNumber = episodeMatch ? episodeMatch[2] : null;
    return { seasonNumber, episodeNumber };
  };
  
  const buildErebusPathFromRecentAnime = async (anime) => {
    const { url: animeUrl, episode } = anime;
    const animeUrlBase = animeUrl.split("/").slice(0, 5).join("/") + "/";
  
    const seasons = await window.electron.ipcRenderer.invoke('get-seasons', animeUrlBase);
    if (!seasons || seasons.length === 0) return null;
  
    let matchingSeason = seasons.find(s => s.url.replace(/\/$/, "") === animeUrl.replace(/\/$/, ""));
    if (!matchingSeason) {
      matchingSeason = seasons.find(s => {
        const loweredTitle = s.title.toLowerCase();
        const loweredEpisode = episode.toLowerCase();
        return loweredEpisode.includes(loweredTitle) || loweredTitle.includes(loweredEpisode);
      });
    }
    if (!matchingSeason) matchingSeason = seasons[0];
  
    const seasonId = toSlug(matchingSeason.title);
    const animeId = animeUrl.split("/catalogue/")[1].split("/")[0];
  
    let embedData = [];
    try {
      embedData = await window.electron.ipcRenderer.invoke('get-episodes', matchingSeason.url);
    } catch (err) {
      console.error("Erreur récupération embed:", err);
    }
    if (!embedData || embedData.length === 0) return null;
  
    const { seasonNumber, episodeNumber } = parseSeasonEpisodeNumbers(episode);
    const episodeInfo = episode.toLowerCase();
  
    let typeToSearch = 'episode';
    if (episodeInfo.includes('oav') || episodeInfo.includes('ova')) typeToSearch = 'oav';
    else if (episodeInfo.includes('film')) typeToSearch = 'film';
    else if (episodeInfo.includes('spécial') || episodeInfo.includes('special')) typeToSearch = 'special';
  
    let matchedEmbed = null;
  
    matchedEmbed = embedData.find(e => cleanString(e.title) === cleanString(episode));
  
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
      matchedEmbed = embedData.find(e => cleanString(e.title).includes(cleanString(episode)) || cleanString(episode).includes(cleanString(e.title)));
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
        <div className="AFK">
          <p>Aucun épisode disponible</p>
        </div>
      )}
    </div>
  );
};

export default LatestEpisodes;
