import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSpotify } from '../hooks/useSpotify';
import TrackCard from '../components/cards/TrackCard';

export default function Mainframe() {
  const { setUser, user } = useAuthStore();
  const { getProfile, getRecentlyPlayed, playTrack } = useSpotify();
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ followers: 0, playlists: '—' });

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
        console.error('[MAINFRAME] Load error:', err);
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
          <span className="text-sm font-mono text-slate-400 tracking-wider">LOADING MAINFRAME...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-24 px-4 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-6 mb-10">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user?.images?.[0]?.url ? (
            <img
              src={user.images[0].url}
              alt={user.display_name}
              className="w-24 h-24 clip-angular object-cover border-2 border-accent-cyan/30"
            />
          ) : (
            <div className="w-24 h-24 clip-angular bg-slate-mid border-2 border-accent-cyan/30 flex items-center justify-center">
              <span className="text-2xl font-display font-bold text-accent-cyan">
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
          <h1 className="text-3xl font-display font-bold text-white mb-2 truncate">
            {user?.display_name || 'Unknown Operator'}
          </h1>
          <div className="flex items-center gap-6">
            <div>
              <span className="data-label">FOLLOWERS</span>
              <p className="data-value text-accent-cyan">{stats.followers.toLocaleString()}</p>
            </div>
            <div>
              <span className="data-label">SUBSCRIPTION</span>
              <p className="data-value text-accent-fuchsia uppercase">{stats.product}</p>
            </div>
            <div>
              <span className="data-label">COUNTRY</span>
              <p className="data-value text-accent-amber">{user?.country || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-gradient-to-r from-accent-fuchsia/20 via-accent-cyan/10 to-transparent mb-8" />

      {/* Recently Played */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 bg-accent-cyan" />
          <h2 className="text-[11px] font-mono text-slate-400 tracking-[0.2em]">RECENTLY PLAYED // SIGNAL LOG</h2>
        </div>

        <div className="grid gap-2">
          {recentTracks.length > 0 ? (
            recentTracks.map((item, i) => (
              <TrackCard
                key={`${item.track.id}-${i}`}
                track={item.track}
                rank={null}
                onPlay={() => {}}
              />
            ))
          ) : (
            <div className="fui-panel clip-angular p-8 text-center">
              <span className="text-sm font-mono text-slate-500">NO RECENT SIGNALS DETECTED</span>
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats Panels */}
      <section className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="fui-panel clip-angular-sm p-4 corner-brackets">
          <span className="data-label">SYSTEM STATUS</span>
          <p className="data-value text-accent-cyan mt-1">ONLINE</p>
          <p className="text-[10px] font-mono text-slate-600 mt-2">Web Playback SDK Active</p>
        </div>
        <div className="fui-panel clip-angular-sm p-4 corner-brackets">
          <span className="data-label">SESSION</span>
          <p className="data-value text-accent-fuchsia mt-1">ACTIVE</p>
          <p className="text-[10px] font-mono text-slate-600 mt-2">PKCE Auth Verified</p>
        </div>
        <div className="fui-panel clip-angular-sm p-4 corner-brackets">
          <span className="data-label">TRACKS LOGGED</span>
          <p className="data-value text-accent-amber mt-1">{recentTracks.length}</p>
          <p className="text-[10px] font-mono text-slate-600 mt-2">Last 24h Activity</p>
        </div>
      </section>
    </div>
  );
}
