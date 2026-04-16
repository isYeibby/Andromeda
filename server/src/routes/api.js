import { Router } from 'express';
import { tokenCheck } from '../middleware/tokenCheck.js';

const SPOTIFY_API = 'https://api.spotify.com/v1';
const MAX_RETRIES = 3;

export const apiRouter = Router();

// All /api routes require a valid access token
apiRouter.use(tokenCheck);

/**
 * Spotify API proxy with exponential backoff for 429 rate-limit errors
 */
async function spotifyFetch(url, options = {}, retries = 0) {
  const response = await fetch(url, options);

  if (response.status === 429 && retries < MAX_RETRIES) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
    const backoff = retryAfter * 1000 * Math.pow(2, retries);
    console.warn(`[API] Rate limited. Retrying in ${backoff}ms (attempt ${retries + 1}/${MAX_RETRIES})`);
    await new Promise(resolve => setTimeout(resolve, backoff));
    return spotifyFetch(url, options, retries + 1);
  }

  return response;
}

/**
 * Generic proxy handler — forwards request to Spotify API with auth header
 */
function proxyGet(spotifyPath) {
  return async (req, res, next) => {
    try {
      const queryString = new URLSearchParams(req.query).toString();
      const url = `${SPOTIFY_API}${spotifyPath}${queryString ? `?${queryString}` : ''}`;

      const response = await spotifyFetch(url, {
        headers: { Authorization: req.headers.authorization },
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.json(data);
    } catch (err) {
      next(err);
    }
  };
}

// === Profile ===
apiRouter.get('/me', proxyGet('/me'));

// === Top Items ===
apiRouter.get('/me/top/:type', (req, res, next) => {
  const { type } = req.params;
  if (!['artists', 'tracks'].includes(type)) {
    return res.status(400).json({ error: 'Type must be "artists" or "tracks"' });
  }
  return proxyGet(`/me/top/${type}`)(req, res, next);
});

// === Recently Played ===
apiRouter.get('/me/player/recently-played', proxyGet('/me/player/recently-played'));

// === Audio Features (batch) ===
apiRouter.get('/audio-features', proxyGet('/audio-features'));

// === Playback State ===
apiRouter.get('/me/player', proxyGet('/me/player'));

// === Transfer Playback ===
apiRouter.put('/me/player', async (req, res, next) => {
  try {
    const response = await spotifyFetch(`${SPOTIFY_API}/me/player`, {
      method: 'PUT',
      headers: {
        Authorization: req.headers.authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (response.status === 204) return res.sendStatus(204);
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// === Play a track ===
apiRouter.put('/me/player/play', async (req, res, next) => {
  try {
    const queryString = new URLSearchParams(req.query).toString();
    const url = `${SPOTIFY_API}/me/player/play${queryString ? `?${queryString}` : ''}`;

    const response = await spotifyFetch(url, {
      method: 'PUT',
      headers: {
        Authorization: req.headers.authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (response.status === 204) return res.sendStatus(204);

    const text = await response.text();
    if (!text) return res.sendStatus(response.status);

    const data = JSON.parse(text);
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// === Create Playlist ===
apiRouter.post('/users/:userId/playlists', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const response = await spotifyFetch(`${SPOTIFY_API}/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: req.headers.authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// === Add Tracks to Playlist ===
apiRouter.post('/playlists/:playlistId/tracks', async (req, res, next) => {
  try {
    const { playlistId } = req.params;
    const response = await spotifyFetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: req.headers.authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
