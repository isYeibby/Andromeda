import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSpotify } from '../hooks/useSpotify';

function formatDuration(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function Mainframe() {
  const { setUser, user } = useAuthStore();
  const { getProfile, getRecentlyPlayed } = useSpotify();
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ followers: 0, product: 'free', country: '—' });

  useEffect(() => {
    async function load() {
      try {
        const [profile, recent] = await Promise.all([
          getProfile(),
          getRecentlyPlayed(20),
        ]);

        setUser(profile);
        setStats({
          followers: profile.followers?.total || 0,
          product: profile.product || 'free',
          country: profile.country || '—',
        });

        // Deduplicate tracks
        const seen = new Set();
        const unique = (recent.items || []).filter(item => {
          if (seen.has(item.track.id)) return false;
          seen.add(item.track.id);
          return true;
        });
        setRecentTracks(unique);
      } catch (err) {
        console.error('[TELEMETRY] Load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="pt-20 pb-24 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-2 border-accent-fuchsia border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono text-slate-400 tracking-wider">LOADING TELEMETRY...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-24 px-4 max-w-7xl mx-auto animate-fade-in">
      {/* ========= USER STATUS PANEL ========= */}
      <div className="fui-panel clip-angular p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 bg-accent-cyan" />
          <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em]">USER STATUS PANEL</span>
        </div>

        <div className="flex items-start gap-6">
          {/* Large Avatar */}
          <div className="flex-shrink-0">
            {user?.images?.[0]?.url ? (
              <img
                src={user.images[0].url}
                alt={user.display_name}
                className="w-32 h-32 clip-angular object-cover border-2 border-accent-cyan/30"
              />
            ) : (
              <div className="w-32 h-32 clip-angular bg-slate-mid border-2 border-accent-cyan/30 flex items-center justify-center">
                <span className="text-4xl font-display font-bold text-accent-cyan">
                  {user?.display_name?.[0] || '?'}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-accent-fuchsia tracking-[0.2em]">OPERATOR</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3 truncate">
              {user?.display_name || 'Unknown Operator'}
            </h1>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Followers */}
              <div>
                <span className="data-label">FOLLOWERS</span>
                <p className="data-value text-accent-cyan">{stats.followers.toLocaleString()}</p>
              </div>

              {/* Premium badge */}
              <div>
                <span className="data-label">SUBSCRIPTION</span>
                <div className="mt-0.5">
                  {stats.product === 'premium' ? (
                    <span className="inline-block bg-accent-rose text-white text-[10px] font-mono font-bold tracking-wider px-3 py-1 clip-angular-sm">
                      PREMIUM
                    </span>
                  ) : (
                    <p className="data-value text-slate-400 uppercase">{stats.product}</p>
                  )}
                </div>
              </div>

              {/* Region */}
              <div>
                <span className="data-label">REGION</span>
                <p className="data-value text-accent-rose">{stats.country}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========= TERMINAL DIVIDER ========= */}
      <div className="relative mb-8">
        <div className="h-[1px] bg-gradient-to-r from-accent-cyan/40 via-accent-cyan/15 to-transparent" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <div className="w-2 h-2 bg-accent-cyan/60" />
          <div className="w-1 h-1 bg-accent-cyan/40" />
          <div className="w-0.5 h-0.5 bg-accent-cyan/20" />
        </div>
      </div>

      {/* ========= RECENTLY PLAYED // SIGNAL LOG ========= */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 bg-accent-cyan" />
          <h2 className="text-[11px] font-mono text-slate-400 tracking-[0.2em]">RECENTLY PLAYED // SIGNAL LOG</h2>
          <span className="text-[10px] font-mono text-slate-600 ml-auto">{recentTracks.length} ENTRIES</span>
        </div>

        <div className="space-y-1">
          {recentTracks.length > 0 ? (
            recentTracks.map((item, i) => {
              const track = item.track;
              const albumArt = track.album?.images?.[track.album.images.length - 1]?.url
                || track.album?.images?.[0]?.url;

              return (
                <div
                  key={`${track.id}-${i}`}
                  className="group fui-panel p-2.5 sm:p-3 flex items-center gap-3 
                             transition-all duration-300 hover:border-accent-fuchsia/30"
                >
                  {/* Small album image */}
                  {albumArt ? (
                    <img
                      src={albumArt}
                      alt={track.album?.name}
                      className="w-10 h-10 clip-angular-sm object-cover flex-shrink-0 
                                 border border-white/5 group-hover:border-accent-fuchsia/30 transition-colors"
                    />
                  ) : (
                    <div className="w-10 h-10 clip-angular-sm bg-slate-mid flex-shrink-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 18V5l12-2v13"/>
                      </svg>
                    </div>
                  )}

                  {/* Song Name - Artist */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-display font-semibold text-white truncate group-hover:text-accent-fuchsia transition-colors">
                      {track.name}
                      <span className="text-slate-500 font-normal mx-2">—</span>
                      <span className="text-[12px] font-mono text-slate-400 font-normal">
                        {track.artists?.map(a => a.name).join(', ')}
                      </span>
                    </p>
                  </div>

                  {/* Duration aligned right */}
                  {track.duration_ms && (
                    <span className="text-[10px] font-mono text-slate-600 flex-shrink-0 tabular-nums">
                      {formatDuration(track.duration_ms)}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="fui-panel clip-angular p-8 text-center">
              <span className="text-sm font-mono text-slate-500">NO RECENT SIGNALS DETECTED</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
