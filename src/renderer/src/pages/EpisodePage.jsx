import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const EpisodePage = () => {
  const { episodeId } = useParams(); // Extraction de l'ID de l'épisode
  const [episodeLink, setEpisodeLink] = useState(null);

  useEffect(() => {
    const fetchEpisodeLink = async () => {
      try {
        const link = await window.electron.ipcRenderer.invoke('get-episodes', episodeId);
        setEpisodeLink(link); // Stocker le lien de l'épisode
      } catch (error) {
        console.error('Erreur lors de la récupération du lien de l\'épisode:', error);
      }
    };

    if (episodeId) {
      fetchEpisodeLink();
    }
  }, [episodeId]);

  return (
    <div>
      {episodeLink ? (
        <iframe src={episodeLink} width="100%" height="500px" allowFullScreen title="Episode Video"></iframe>
      ) : (
        <p>Chargement de l'épisode...</p>
      )}
    </div>
  );
};

export default EpisodePage;
