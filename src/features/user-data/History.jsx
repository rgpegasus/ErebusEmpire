import { AnimeLibrary } from './components/AnimeLibrary';

export const History = () => (
  <AnimeLibrary
    storageKey="animeWatchHistory"
    title="Animés & Scans en Cours :"
    sort={true}
    customType="~en Cours"
  />
)
