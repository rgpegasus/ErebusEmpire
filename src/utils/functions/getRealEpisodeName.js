import { toSlug } from '@utils/functions/toSlug'

async function getRealEpisodeName (episodeInfo) {
    const { url: animeUrl, episode } = episodeInfo;
    console.log(animeUrl, episode, "caca")
    const animeId = animeUrl.split("/").slice(4, 5).join("/");
    let embedData = [];
    let seasonTitle = "null"; 
    try {
      const data = await window.electron.ipcRenderer.invoke('get-episodes', animeUrl, true, true);
      const { animeInfo, episodes } = data;
      embedData = episodes
      seasonTitle = animeInfo.seasonTitle
    } catch (err) {
      console.error("Erreur récupération embed:", err);
    }
    if (!embedData || embedData.length === 0) return null;
    const seasonId = animeUrl.split("/").slice(5, 6).join("/");
    const episodeFakeName = episode.toLowerCase();
    const episodeMatch = episodeFakeName.match(/e(pisode)?\s*(\d+)/i); 
    const episodeNumber = episodeMatch ? episodeMatch[2] : null;
  
    let typeToSearch = 'episode';
    if (episodeFakeName.includes('oav') || episodeFakeName.includes('ova')) typeToSearch = 'oav';
    else if (episodeFakeName.includes('film')) typeToSearch = 'film';
    else if (episodeFakeName.includes('spécial') || episodeFakeName.includes('special')) typeToSearch = 'special';
  
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
  
  export { getRealEpisodeName }