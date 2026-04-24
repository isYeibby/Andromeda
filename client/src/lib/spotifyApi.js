/**
 * =============================================
 * ANDROMEDA // Spotify API Interceptor
 * =============================================
 *
 * Singleton module that wraps all Spotify API calls.
 * Handles:
 *   - Auto-attaching Bearer token
 *   - 401 detection → refresh once (mutex) → retry queued requests
 *   - Clean logout + redirect on refresh failure
 *
 * Uses Zustand store directly (getState) so it works outside React components.
 */

import { useAuthStore } from '../store/useAuthStore.js';

const API_URL = import.meta.env.VITE_API_URL || '';

// ── Refresh mutex ──────────────────────────────────
// Prevents multiple simultaneous refresh calls when
// several API requests get 401 at the same time.
let isRefreshing = false;
let refreshPromise = null;

/**
 * Attempt to refresh the access token exactly once.
 * If a refresh is already in progress, returns the existing promise.
 *
 * @returns {Promise<string|null>} New access token or null on failure.
 */
function refreshTokenOnce() {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = useAuthStore
    .getState()
    .refreshAccessToken()
    .then((newToken) => {
      isRefreshing = false;
      refreshPromise = null;
      return newToken;
    })
    .catch(() => {
      isRefreshing = false;
      refreshPromise = null;
      return null;
    });

  return refreshPromise;
}

/**
 * Core fetch wrapper — every API call goes through here.
 *
 * @param {string}  endpoint  Path relative to /api (e.g. '/me')
 * @param {object}  options   Standard fetch options (method, body, headers, signal)
 * @returns {Promise<any>}    Parsed JSON response
 */
async function spotifyFetch(endpoint, options = {}) {
  // 1. Get a valid token (auto-refreshes if near expiry)
  const token = await useAuthStore.getState().getValidToken();

  if (!token) {
    // No token at all — force logout
    handleForceLogout();
    throw new Error('[ANDROMEDA] No valid token — session expired');
  }

  // 2. Build request
  const url = `${API_URL}/api${endpoint}`;
  const fetchOptions = {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // 3. Execute
  const res = await fetch(url, fetchOptions);

  // 4. Handle 204 (No Content)
  if (res.status === 204) return null;

  // 5. Handle 401 — attempt refresh and retry ONCE
  if (res.status === 401) {
    console.warn('[ANDROMEDA] 401 detected — attempting token refresh...');

    const newToken = await refreshTokenOnce();

    if (!newToken) {
      console.error('[ANDROMEDA] Token refresh failed — logging out');
      handleForceLogout();
      throw new Error('Authentication expired — redirecting to Airlock');
    }

    // Retry the original request with the new token
    const retryOptions = {
      ...options,
      headers: {
        Authorization: `Bearer ${newToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const retryRes = await fetch(url, retryOptions);

    if (retryRes.status === 204) return null;

    if (!retryRes.ok) {
      const errData = await retryRes.json().catch(() => ({}));
      throw new Error(
        errData.error?.message || errData.error || `API error: ${retryRes.status}`
      );
    }

    return retryRes.json();
  }

  // 6. Handle other errors
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData.error?.message || errData.error || `API error: ${res.status}`
    );
  }

  // 7. Success
  return res.json();
}

/**
 * Force logout — clears all auth state and redirects to Airlock.
 */
function handleForceLogout() {
  const { logout } = useAuthStore.getState();
  logout();
  // Only redirect if not already on the root page
  if (window.location.pathname !== '/') {
    window.location.href = '/';
  }
}

// ── Public API ─────────────────────────────────────

const spotifyApi = {
  /**
   * GET request to the Spotify API proxy.
   * @param {string} endpoint  e.g. '/me', '/me/top/artists?limit=50'
   * @param {object} options   Additional fetch options (signal, etc.)
   */
  get: (endpoint, options = {}) =>
    spotifyFetch(endpoint, { method: 'GET', ...options }),

  /**
   * PUT request (e.g. play track, transfer playback).
   */
  put: (endpoint, body, options = {}) =>
    spotifyFetch(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  /**
   * POST request (e.g. create playlist, add tracks).
   */
  post: (endpoint, body, options = {}) =>
    spotifyFetch(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
};

export default spotifyApi;
