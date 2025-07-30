import { AnimeScraper } from 'better-ani-scraped';
const scraper = new AnimeScraper("animesama");
import fs from 'fs';
import { join } from 'path';
import { animeData } from './backgroundData.js';

const filePath = join(process.cwd(), 'background-test.txt');
const CHECK_INTERVAL_MS = 1000 * 60 * 10;
async function checkNewEpisodes() {
  
  try {
    // fs.appendFileSync(filePath, "[Debug] Début du check\n");
    const latestEpisodes = await scraper.getLatestEpisodes(["vostfr", "vf"]);
    // fs.appendFileSync(filePath, `[Debug] Épisodes récupérés : ${JSON.stringify(latestEpisodes, null, 2)}\n`);
    if (!latestEpisodes || latestEpisodes.length === 0) return;

    const animeOnHold = await animeData.loadAll("animeOnHold");
    // fs.appendFileSync(filePath, `[Debug] Épisodes récupérés : ${JSON.stringify(animeOnHold, null, 2)}\n`);
    if (!animeOnHold) return;


    // 🔄 Charger la liste déjà notifiée (tableau)
    const alreadyNotifiedList = (await animeData.loadAll("notifiedEpisodes")) || [];
    // fs.appendFileSync(filePath, `[Debug] Contenu de notifiedEpisodes : ${JSON.stringify(alreadyNotifiedList, null, 2)}\n`);

    // 🔍 Création d'une map pour accès rapide
    const watchMap = Object.values(animeOnHold).reduce((acc, anime) => {
      acc[anime.animeTitle.toLowerCase()] = anime;
      return acc;
    }, {});

    const newEpisodes = [];

    for (const ep of latestEpisodes) {
      const titleKey = ep.title.toLowerCase();
      const match = watchMap[titleKey];
      if (!match) continue;

      const alreadyExists = alreadyNotifiedList.some(
        (e) => e.title === ep.title && e.episode === ep.episode && e.language === ep.language
      );
      if (alreadyExists) continue;

      newEpisodes.push({
        title: ep.title,
        url: ep.url,
        cover: ep.cover || match.animeCover,
        language: ep.language,
        episode: ep.episode,
        addedAt: new Date().toISOString()
      });
    }

    if (newEpisodes.length > 0) {
      const updated = [...newEpisodes, ...alreadyNotifiedList]; 
      await animeData.save("notifiedEpisodes", updated); 
    }
  } catch (err) {
    fs.appendFileSync(filePath, `[Erebus] Erreur lors de la vérification des épisodes : ${err}\n`);
  }
}

checkNewEpisodes();
setInterval(checkNewEpisodes, CHECK_INTERVAL_MS);
