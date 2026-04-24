/**
 * =============================================
 * useSpotify — Custom hook for Spotify API calls
 * =============================================
 *
 * Thin wrapper around spotifyApi interceptor.
 * All 401 handling, token refresh, and logout are
 * handled automatically by the interceptor.
 */

import spotifyApi from '../lib/spotifyApi.js';

export function useSpotify() {
  return {
    // === Profile ===
    getProfile: () => spotifyApi.get('/me'),

    // === Top Items ===
    getTopItems: (type = 'tracks', timeRange = 'medium_term', limit = 20) =>
      spotifyApi.get(`/me/top/${type}?time_range=${timeRange}&limit=${limit}`),

    // === Multiple Artists ===
    getArtists: (ids) =>
      spotifyApi.get(`/artists?ids=${ids.join(',')}`),

    // === Audio Features ===
    getAudioFeatures: (ids) =>
      spotifyApi.get(`/audio-features?ids=${ids.join(',')}`),

    // === Recently Played ===
    getRecentlyPlayed: (limit = 20) =>
      spotifyApi.get(`/me/player/recently-played?limit=${limit}`),

    // === Playback ===
    playTrack: (deviceId, uris) =>
      spotifyApi.put(`/me/player/play?device_id=${deviceId}`, { uris }),

    transferPlayback: (deviceId, play = true) =>
      spotifyApi.put('/me/player', { device_ids: [deviceId], play }),

    // === Playlists ===
    createPlaylist: async (userId, name, description = '') => {
      const playlist = await spotifyApi.post(`/users/${userId}/playlists`, {
        name,
        description,
        public: true,
      });
      return playlist;
    },

    addTracksToPlaylist: (playlistId, uris) =>
      spotifyApi.post(`/playlists/${playlistId}/tracks`, { uris }),
  };
}
