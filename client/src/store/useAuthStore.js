import { create } from 'zustand';

// =====================================
// PKCE Helpers
// =====================================

function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach(b => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generateCodeChallenge(verifier) {
  const hashed = await sha256(verifier);
  return base64urlEncode(hashed);
}

export function generateCodeVerifier() {
  return generateRandomString(64);
}

// =====================================
// Auth Store
// =====================================

const API_URL = import.meta.env.VITE_API_URL || '';

export const useAuthStore = create((set, get) => ({
  accessToken: localStorage.getItem('vs_access_token') || null,
  refreshToken: localStorage.getItem('vs_refresh_token') || null,
  expiresAt: parseInt(localStorage.getItem('vs_expires_at') || '0', 10),
  user: null,
  isAuthenticated: !!localStorage.getItem('vs_access_token'),
  isLoading: false,

  setTokens: ({ access_token, refresh_token, expires_in }) => {
    const expiresAt = Date.now() + expires_in * 1000;
    localStorage.setItem('vs_access_token', access_token);
    if (refresh_token) localStorage.setItem('vs_refresh_token', refresh_token);
    localStorage.setItem('vs_expires_at', expiresAt.toString());
    set({
      accessToken: access_token,
      refreshToken: refresh_token || get().refreshToken,
      expiresAt,
      isAuthenticated: true,
    });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('vs_access_token');
    localStorage.removeItem('vs_refresh_token');
    localStorage.removeItem('vs_expires_at');
    set({
      accessToken: null,
      refreshToken: null,
      expiresAt: 0,
      user: null,
      isAuthenticated: false,
    });
  },

  refreshAccessToken: async () => {
    const { refreshToken } = get();
    if (!refreshToken) {
      get().logout();
      return null;
    }

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        get().logout();
        return null;
      }

      const data = await res.json();
      get().setTokens(data);
      return data.access_token;
    } catch {
      get().logout();
      return null;
    }
  },

  getValidToken: async () => {
    const { accessToken, expiresAt, refreshAccessToken } = get();
    // Refresh 60s before expiry
    if (accessToken && Date.now() < expiresAt - 60000) {
      return accessToken;
    }
    return refreshAccessToken();
  },

  // Initiate PKCE login
  login: async () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_REDIRECT_URI;
    const scopes = [
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-top-read',
      'user-read-recently-played',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-email',
      'user-read-private',
    ].join(' ');

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store verifier for callback
    sessionStorage.setItem('vs_code_verifier', codeVerifier);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scopes,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  },
}));
