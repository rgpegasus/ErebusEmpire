import { AnimeLibrary } from './components/AnimeLibrary';

export const AlreadySeen = () => (
  <AnimeLibrary
    storageKey="animeAlreadySeen"
    title="Animés déjà vus :"
    customType="Terminé"
  />
);
