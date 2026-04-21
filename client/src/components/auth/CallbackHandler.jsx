import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function CallbackHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();
  const [error, setError] = useState(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) return;

    const handleCallback = async () => {
      isProcessing.current = true;
      const code = searchParams.get('code');
      const authError = searchParams.get('error');

      if (authError) {
        setError(`Spotify authorization failed: ${authError}`);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      const codeVerifier = localStorage.getItem('vs_code_verifier');
      if (!codeVerifier) {
        setError('PKCE verification failed — code_verifier not found');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
            redirect_uri: import.meta.env.VITE_REDIRECT_URI,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Token exchange failed');
        }

        const tokens = await res.json();
        setTokens(tokens);
        localStorage.removeItem('vs_code_verifier');
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err.message);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setTokens]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-deep flex items-center justify-center">
        <div className="fui-panel clip-angular p-8 max-w-md text-center">
          <div className="text-accent-red text-glow-red text-sm font-mono mb-4">
            ⚠ AUTHENTICATION ERROR
          </div>
          <p className="text-slate-400 text-sm font-mono mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
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
