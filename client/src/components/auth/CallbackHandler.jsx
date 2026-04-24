import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * CallbackHandler — Handles Spotify OAuth PKCE callback
 *
 * Fixes applied:
 *   - Robust guard against StrictMode double-mount
 *   - Immediate code_verifier retrieval before any async work
 *   - Fallback timeout for stalled fetches
 *   - Clean error UI with retry option
 */
export default function CallbackHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();
  const [error, setError] = useState(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Guard: only process once, even with StrictMode double-mount
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const code = searchParams.get('code');
    const authError = searchParams.get('error');

    // ── Error from Spotify ──
    if (authError) {
      setError(`Spotify authorization failed: ${authError}`);
      return;
    }

    // ── Missing code ──
    if (!code) {
      setError('No authorization code received from Spotify');
      return;
    }

    // ── Retrieve PKCE verifier IMMEDIATELY (sync, before any async work) ──
    // Try localStorage first, then sessionStorage as fallback (dual-write strategy)
    const codeVerifier = localStorage.getItem('vs_code_verifier')
      || sessionStorage.getItem('vs_code_verifier');
    if (!codeVerifier) {
      setError(
        'PKCE verification failed — code_verifier not found. ' +
        'This can happen if the page was refreshed during login. Please try again.'
      );
      return;
    }

    // ── Token exchange with timeout ──
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    async function exchangeToken() {
      try {
        const res = await fetch(`${API_URL}/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
            redirect_uri: import.meta.env.VITE_REDIRECT_URI,
          }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error || data.error_description || `Token exchange failed (${res.status})`
          );
        }

        // Success — save tokens and clean up
        setTokens(data);
        localStorage.removeItem('vs_code_verifier');
        sessionStorage.removeItem('vs_code_verifier');
        navigate('/dashboard', { replace: true });
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Token exchange timed out. The server may be starting up — please try again.');
        } else {
          setError(err.message);
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    exchangeToken();

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []); // No deps — runs once on mount

  // ── Retry handler — sends user back to Airlock for fresh login ──
  const handleRetry = () => {
    localStorage.removeItem('vs_code_verifier');
    localStorage.removeItem('vs_access_token');
    localStorage.removeItem('vs_refresh_token');
    localStorage.removeItem('vs_expires_at');
    navigate('/', { replace: true });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-deep flex items-center justify-center">
        <div className="fui-panel clip-angular p-8 max-w-md text-center">
          <div className="text-accent-red text-glow-red text-sm font-mono mb-4">
            ⚠ AUTHENTICATION ERROR
          </div>
          <p className="text-slate-400 text-sm font-mono mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="btn-neon clip-angular-sm text-accent-cyan"
          >
            RETURN TO AIRLOCK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-deep flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-accent-fuchsia border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-mono text-slate-400 tracking-wider animate-pulse">
          ESTABLISHING ANDROMEDA LINK...
        </span>
      </div>
    </div>
  );
}
