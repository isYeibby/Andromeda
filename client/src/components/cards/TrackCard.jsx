export default function TrackCard({ track, rank, onPlay, isPlaying }) {
  const albumArt = track.album?.images?.[0]?.url || track.album?.images?.[1]?.url;

  return (
    <div
      onClick={onPlay}
      className={`group fui-panel clip-angular-sm p-3 flex items-center gap-3 cursor-pointer
                  transition-all duration-300 hover:border-accent-fuchsia/40 hover:shadow-neon-fuchsia
                  ${isPlaying ? 'border-accent-fuchsia/50 shadow-neon-fuchsia' : ''}`}
    >
      {/* Rank */}
      {rank != null && (
        <div className="w-7 text-center flex-shrink-0">
          <span className={`text-xs font-mono font-bold
            ${rank <= 3 ? 'text-accent-fuchsia text-glow-fuchsia' : 'text-slate-500'}`}>
            {String(rank).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Album Art */}
      {albumArt ? (
        <img
          src={albumArt}
          alt={track.album?.name}
          className="w-10 h-10 clip-angular-sm object-cover flex-shrink-0 border border-white/5
                     group-hover:border-accent-fuchsia/30 transition-colors"
        />
      ) : (
        <div className="w-10 h-10 clip-angular-sm bg-slate-mid flex-shrink-0 flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13"/>
          </svg>
        </div>
      )}

      {/* Track Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-display font-semibold text-white truncate group-hover:text-accent-fuchsia transition-colors">
          {track.name}
        </p>
        <p className="text-[11px] font-mono text-slate-400 truncate">
          {track.artists?.map(a => a.name).join(', ')}
        </p>
      </div>

      {/* Duration */}
      {track.duration_ms && (
        <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">
          {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
        </span>
      )}

      {/* Play indicator */}
      {isPlaying && (
        <div className="flex items-center gap-[2px] flex-shrink-0">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-[2px] bg-accent-fuchsia rounded-full animate-pulse"
              style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
