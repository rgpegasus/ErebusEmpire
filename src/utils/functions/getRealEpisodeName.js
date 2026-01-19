import { toSlug } from '@utils/functions/toSlug'
import { sanitizeName } from '@utils/functions/sanitizeName'

async function getRealEpisodeName (episodeInfo) {
    let { url: animeUrl, episode } = episodeInfo;
    
    let embedData = [];
    let seasonTitle = "null"; 
    if (animeUrl.startsWith("/catalogue")) {
      animeUrl = BASE_URL + animeUrl
    }  
    const animeId = animeUrl.split("/").slice(4, 5).join("/");
    try {
      const { animeInfo, episodes } = await window.electron.ipcRenderer.invoke(
        "get-episodes",
        animeUrl,
        true,
        true,
      )
      embedData = episodes
      seasonTitle = animeInfo.seasonTitle
    } catch (err) {
      console.error("Erreur récupération embed:", err);
    }

    
   
    if (!embedData || embedData.length === 0) return null;
    const seasonId = animeUrl.split("/").slice(5, 6).join("/");
    const episodeFakeName = sanitizeName(episode);
    const episodeMatch = episodeFakeName.match(/episode(\d+)/i);
    const episodeNumber = episodeMatch ? episodeMatch[1] : null;
  
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
      ? `/erebus-empire/${animeId}/${seasonId}/${episodeSlug}`
      : `/erebus-empire/${animeId}/${seasonId}`;
  
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