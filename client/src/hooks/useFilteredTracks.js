import { useState, useMemo } from 'react';

/**
 * useFilteredTracks — Parametric filtering hook for Data Vault
 *
 * @param {Array} tracks — Array of Spotify track objects
 * @param {Object} featuresMap — Map of trackId -> audio features object
 * @returns Filtered tracks + slider state
 */
export function useFilteredTracks(tracks = [], featuresMap = {}) {
  const [minEnergy, setMinEnergy] = useState(0);
  const [minDanceability, setMinDanceability] = useState(0);

  const filteredTracks = useMemo(() => {
    if (minEnergy === 0 && minDanceability === 0) return tracks;

    return tracks.filter(track => {
      const features = featuresMap[track.id];
      if (!features) return true; // Keep tracks without features data
      const energy = (features.energy || 0) * 100;
      const danceability = (features.danceability || 0) * 100;
      return energy >= minEnergy && danceability >= minDanceability;
    });
  }, [tracks, featuresMap, minEnergy, minDanceability]);

  return {
    minEnergy,
    setMinEnergy,
    minDanceability,
    setMinDanceability,
    filteredTracks,
  };
}
