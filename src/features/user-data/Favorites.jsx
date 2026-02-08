import { AnimeLibrary } from './components/AnimeLibrary';

export const Favorites = () => (
  <AnimeLibrary
    storageKey="animeFavorites"
    title="Animés & Scans Favoris :"
    customType="Favori"
  />
);
