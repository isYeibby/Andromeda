import { Router } from 'express';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

export const authRouter = Router();

/**
 * GET /callback
 * Spotify redirects the browser here after user authorization.
 * We forward the code (or error) to the client app for PKCE token exchange.
 */
export function callbackHandler(req, res) {
  const clientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:5173';
  const { code, error, state } = req.query;

  const params = new URLSearchParams();
  if (code) params.set('code', code);
  if (error) params.set('error', error);
  if (state) params.set('state', state);

  console.log('[AUTH] Spotify callback received, redirecting to client');
  res.redirect(`${clientUrl}/callback?${params.toString()}`);
}

/**
 * POST /auth/token
 * Exchange authorization code + code_verifier for access & refresh tokens (PKCE flow)
 */
authRouter.post('/token', async (req, res, next) => {
  try {
    const { code, code_verifier, redirect_uri } = req.body;

    if (!code || !code_verifier) {
      return res.status(400).json({ error: 'Missing code or code_verifier' });
    }

    const params = new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirect_uri || process.env.SPOTIFY_REDIRECT_URI,
      code_verifier,
    });

    let response;
    try {
      response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    } catch (fetchErr) {
      console.error('[AUTH] Network error fetching Spotify token:', fetchErr.message);
      return res.status(502).json({ error: 'Failed to connect to Spotify API', details: fetchErr.message });
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error('[AUTH] Failed to parse Spotify token response:', parseErr.message);
      return res.status(502).json({ error: 'Invalid response from Spotify API', details: parseErr.message });
    }

    if (!response.ok) {
      console.error('[AUTH] Token exchange failed:', data);
      return res.status(response.status).json({
        error: data.error_description || data.error || 'Token exchange failed',
        code: 'TOKEN_EXCHANGE_FAILED',
        details: data,
      });
    }

    console.log('[AUTH] Token exchange successful');
    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/refresh
 * Refresh an expired access token using the refresh_token
 */
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Missing refresh_token' });
    }

    const params = new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token,
    });

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[AUTH] Token refresh failed:', data);
      return res.status(response.status).json({
        error: data.error_description || data.error || 'Token refresh failed',
        code: 'TOKEN_REFRESH_FAILED',
      });
    }

    console.log('[AUTH] Token refreshed successfully');
    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (err) {
    next(err);
  }
});
