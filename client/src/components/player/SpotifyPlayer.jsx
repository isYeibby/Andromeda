import { usePlayer } from '../../hooks/usePlayer';
import { useSpotify } from '../../hooks/useSpotify';
import { useEffect } from 'react';

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function SpotifyPlayer() {
  const {
    isReady,
    isPlaying,
    currentTrack,
    position,
    duration,
    volume,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    deviceId,
  } = usePlayer();

  const { transferPlayback } = useSpotify();

  // Auto-transfer playback to this device when ready
  useEffect(() => {
    if (isReady && deviceId) {
      transferPlayback(deviceId, false).catch(() => {});
    }
  }, [isReady, deviceId]);

  if (!isReady) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 fui-panel border-t border-accent-cyan/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-accent-rose animate-pulse rounded-full" />
          <span className="text-[11px] font-mono text-slate-400 tracking-wider">
            INITIALIZING PLAYBACK MODULE...
          </span>
        </div>
      </div>
    );
  }

  const progressPct = duration ? (position / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 fui-panel border-t border-accent-cyan/20">
      {/* Segmented progress overlay bar at top of player */}
      <div className="h-[3px] w-full relative overflow-hidden"
           style={{
             background: 'repeating-linear-gradient(90deg, rgba(56, 189, 248, 0.08) 0px, rgba(56, 189, 248, 0.08) 3px, transparent 3px, transparent 5px)',
           }}
      >
        <div
          className="absolute top-0 left-0 h-full transition-all duration-300"
          style={{
            width: `${progressPct}%`,
            background: 'repeating-linear-gradient(90deg, #d946ef 0px, #d946ef 3px, rgba(217, 70, 239, 0.3) 3px, rgba(217, 70, 239, 0.3) 5px)',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {currentTrack?.albumArt ? (
              <img
                src={currentTrack.albumArt}
                alt={currentTrack.album}
                className="w-12 h-12 clip-angular-sm object-cover flex-shrink-0 border border-accent-fuchsia/30"
              />
            ) : (
              <div className="w-12 h-12 clip-angular-sm bg-slate-mid flex-shrink-0 flex items-center justify-center border border-accent-cyan/20">
                <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM21 16c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/>
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-display font-semibold truncate text-white">
                {currentTrack?.name || 'NO SIGNAL'}
              </p>
              <p className="text-[11px] font-mono text-slate-400 truncate">
                {currentTrack?.artist || 'Awaiting input...'}
              </p>
            </div>
            {isPlaying && (
              <div className="flex items-center gap-[2px] ml-2 flex-shrink-0">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[3px] bg-accent-fuchsia rounded-full"
                    style={{
                      height: `${8 + Math.random() * 10}px`,
                      animation: `pulse ${0.5 + i * 0.15}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Angular Controls */}
          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={prevTrack}
              className="w-9 h-9 clip-angular-sm flex items-center justify-center 
                         bg-slate-mid/50 border border-accent-cyan/20
                         text-slate-400 hover:text-accent-cyan hover:border-accent-cyan/50
                         transition-all duration-300"
              aria-label="Previous track"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-11 h-11 clip-angular-sm flex items-center justify-center 
                         bg-accent-fuchsia/20 border-2 border-accent-fuchsia/50 
                         hover:bg-accent-fuchsia/30 hover:shadow-neon-fuchsia 
                         transition-all duration-300"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4 text-accent-fuchsia" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-accent-fuchsia ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              className="w-9 h-9 clip-angular-sm flex items-center justify-center 
                         bg-slate-mid/50 border border-accent-cyan/20
                         text-slate-400 hover:text-accent-cyan hover:border-accent-cyan/50
                         transition-all duration-300"
              aria-label="Next track"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          {/* Progress (seekable) */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <span className="text-[10px] font-mono text-slate-500 w-10 text-right">
              {formatTime(position)}
            </span>
            <div className="flex-1 relative group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={position}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="progress-segmented w-full"
              />
              <div
                className="absolute top-1/2 left-0 h-[6px] -translate-y-1/2 pointer-events-none"
                style={{
                  width: `${progressPct}%`,
                  background: 'repeating-linear-gradient(90deg, #d946ef 0px, #d946ef 4px, rgba(217, 70, 239, 0.3) 4px, rgba(217, 70, 239, 0.3) 6px)',
                }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-500 w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 w-24">
            <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="progress-bar w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
