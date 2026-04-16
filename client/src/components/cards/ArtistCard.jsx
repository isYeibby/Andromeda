export default function ArtistCard({ artist, rank }) {
  const img = artist.images?.[0]?.url || artist.images?.[1]?.url;
  const popularity = artist.popularity || 0;

  return (
    <div className="group fui-panel clip-angular p-4 flex flex-col items-center gap-3
                    transition-all duration-300 hover:border-accent-cyan/40 hover:shadow-neon-cyan">
      {/* Rank badge */}
      {rank != null && (
        <div className="self-start">
          <span className={`text-[10px] font-mono tracking-wider
            ${rank <= 3 ? 'text-accent-fuchsia text-glow-fuchsia' : 'text-slate-600'}`}>
            #{String(rank).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Artist Image (hexagonal frame) */}
      <div className="relative">
        {img ? (
          <img
            src={img}
            alt={artist.name}
            className="w-24 h-24 object-cover rounded-full border-2 border-accent-cyan/20
                       group-hover:border-accent-cyan/50 transition-colors"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-slate-mid flex items-center justify-center border-2 border-accent-cyan/20">
            <svg className="w-8 h-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
            </svg>
          </div>
        )}
        {/* Glow ring on hover */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
             style={{ boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)' }} />
      </div>

      {/* Name */}
      <h3 className="text-sm font-display font-bold text-white text-center truncate w-full
                     group-hover:text-accent-cyan transition-colors">
        {artist.name}
      </h3>

      {/* Genres */}
      {artist.genres?.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {artist.genres.slice(0, 3).map(genre => (
            <span key={genre} className="text-[9px] font-mono text-slate-500 bg-slate-mid/50 px-1.5 py-0.5 uppercase tracking-wider">
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* Popularity Gauge */}
      <div className="w-full mt-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-mono text-slate-600 tracking-widest">POPULARITY</span>
          <span className="text-[10px] font-mono text-accent-cyan">{popularity}</span>
        </div>
        <div className="h-[3px] bg-slate-mid rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${popularity}%`,
              background: `linear-gradient(90deg, #d946ef, #38bdf8)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
