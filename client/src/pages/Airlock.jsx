import { useAuthStore } from '../store/useAuthStore';
import { useEffect, useState } from 'react';

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 2,
  duration: 4 + Math.random() * 8,
  delay: Math.random() * 5,
}));

export default function Airlock() {
  const { login } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-deep relative overflow-hidden flex items-center justify-center">
      {/* BG Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />

      {/* Radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(217, 70, 239, 0.06) 0%, transparent 60%)',
        }}
      />

      {/* Floating particles */}
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-accent-cyan/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Decorative lines */}
      <div className="absolute top-[20%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-cyan/10 to-transparent" />
      <div className="absolute top-[80%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-fuchsia/10 to-transparent" />
      <div className="absolute left-[15%] top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-accent-cyan/5 to-transparent" />
      <div className="absolute right-[15%] top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-accent-fuchsia/5 to-transparent" />

      {/* Corner brackets */}
      <div className="absolute top-8 left-8">
        <div className="w-16 h-16 border-t border-l border-accent-cyan/20" />
      </div>
      <div className="absolute top-8 right-8">
        <div className="w-16 h-16 border-t border-r border-accent-cyan/20" />
      </div>
      <div className="absolute bottom-8 left-8">
        <div className="w-16 h-16 border-b border-l border-accent-cyan/20" />
      </div>
      <div className="absolute bottom-8 right-8">
        <div className="w-16 h-16 border-b border-r border-accent-cyan/20" />
      </div>

      {/* Main content */}
      <div className={`relative z-10 text-center max-w-2xl px-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Status line */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-1.5 h-1.5 bg-accent-cyan animate-pulse rounded-full" />
          <span className="text-[10px] font-mono text-slate-500 tracking-[0.3em]">SYS.STATUS: AWAITING_CONNECTION</span>
        </div>

        {/* Title with glitch */}
        <h1
          className="font-display font-black text-6xl sm:text-8xl tracking-tighter mb-2 glitch-text"
          data-text="VIBE_SYNC"
        >
          <span className="text-white">VIBE</span>
          <span className="text-accent-fuchsia text-glow-fuchsia">_</span>
          <span className="text-white">SYNC</span>
        </h1>

        {/* Version tag */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-accent-fuchsia/50" />
          <span className="text-[10px] font-mono text-accent-fuchsia/60 tracking-[0.2em]">v1.0.0 // BUILD 2026</span>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-accent-fuchsia/50" />
        </div>

        {/* Tagline */}
        <p className="text-sm sm:text-base font-mono text-slate-400 mb-12 tracking-wide">
          <span className="text-accent-cyan">&gt;&gt;</span> NEURAL LINK TO YOUR SOUND SYSTEM
        </p>

        {/* Connect button */}
        <button
          id="connect-spotify-btn"
          onClick={login}
          className="btn-neon clip-angular text-accent-fuchsia text-sm group"
        >
          <span className="relative z-10 flex items-center gap-3">
            {/* Spotify icon */}
            <svg className="w-5 h-5 group-hover:animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            CONNECT TO SPOTIFY
          </span>
        </button>

        {/* Info text */}
        <p className="mt-8 text-[10px] font-mono text-slate-600 tracking-wider">
          REQUIRES SPOTIFY PREMIUM // PKCE SECURED
        </p>

        {/* Decorative HUD elements */}
        <div className="mt-16 flex items-center justify-center gap-8 text-[9px] font-mono text-slate-700 tracking-[0.2em]">
          <span>FREQ: 44.1KHZ</span>
          <span className="text-accent-fuchsia/30">◆</span>
          <span>BIT: 320KBPS</span>
          <span className="text-accent-cyan/30">◆</span>
          <span>CH: STEREO</span>
        </div>
      </div>
    </div>
  );
}
