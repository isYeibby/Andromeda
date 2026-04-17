import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * useSpotify — Custom hook for Spotify API calls with auto token refresh
 */
export function useSpotify() {
  const { getValidToken, logout } = useAuthStore();

  async function apiFetch(endpoint, options = {}) {
    const token = await getValidToken();
    if (!token) {
      logout();
      throw new Error('No valid token');
    }

    const url = `${API_URL}/api${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (res.status === 401) {
      // Try refresh once
      const newToken = await useAuthStore.getState().refreshAccessToken();
      if (!newToken) {
        logout();
        throw new Error('Authentication expired');
      }

      const retry = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${newToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!retry.ok) throw new Error(`API error: ${retry.status}`);
      return retry.json();
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.error || `API error: ${res.status}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  return {
    getProfile: () => apiFetch('/me'),

    getTopItems: (type = 'tracks', timeRange = 'medium_term', limit = 20) =>
      apiFetch(`/me/top/${type}?time_range=${timeRange}&limit=${limit}`),

    getRecentlyPlayed: (limit = 20) =>
      apiFetch(`/me/player/recently-played?limit=${limit}`),

    playTrack: (deviceId, uris) =>
      apiFetch(`/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris }),
      }),

    transferPlayback: (deviceId, play = true) =>
      apiFetch('/me/player', {
        method: 'PUT',
        body: JSON.stringify({ device_ids: [deviceId], play }),
      }),

    createPlaylist: async (userId, name, description = '') => {
      const playlist = await apiFetch(`/users/${userId}/playlists`, {
        method: 'POST',
        body: JSON.stringify({ name, description, public: true }),
      });
      return playlist;
    },

    addTracksToPlaylist: (playlistId, uris) =>
      apiFetch(`/playlists/${playlistId}/tracks`, {
        method: 'POST',
        body: JSON.stringify({ uris }),
      }),
  };
}
