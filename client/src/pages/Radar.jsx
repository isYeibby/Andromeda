import { useEffect, useState } from 'react';
import { useSpotify } from '../hooks/useSpotify';
import AudioRadar from '../components/charts/AudioRadar';

export default function Radar() {
  const { getTopItems, getAudioFeatures } = useSpotify();
  const [topTrack, setTopTrack] = useState(null);
  const [topTenAvg, setTopTenAvg] = useState(null);
  const [topTrackInfo, setTopTrackInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const tracks = await getTopItems('tracks', 'medium_term', 10);
        const items = tracks.items || [];

        if (items.length === 0) {
          setError('No top tracks available yet. Listen to more music!');
          setLoading(false);
          return;
        }

        setTopTrackInfo(items[0]);
        const ids = items.map(t => t.id);

        try {
          const features = await getAudioFeatures(ids);
          const audioFeatures = features.audio_features?.filter(Boolean) || [];

          if (audioFeatures.length > 0) {
            // Top 1 features
            setTopTrack(audioFeatures[0]);

            // Top 10 average
            const avg = {};
            const keys = ['danceability', 'energy', 'valence', 'acousticness', 'instrumentalness', 'speechiness'];
            keys.forEach(k => {
              avg[k] = audioFeatures.reduce((sum, f) => sum + (f[k] || 0), 0) / audioFeatures.length;
            });
            setTopTenAvg(avg);
          }
        } catch {
          // Audio Features might be deprecated for new apps
          setError('Audio Features API unavailable — your app may need legacy access.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="pt-20 pb-24 px-4 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <span className="w-1.5 h-1.5 bg-accent-cyan" />
        <h1 className="text-[11px] font-mono text-slate-400 tracking-[0.2em]">
          RADAR // AUDIO FREQUENCY ANALYSIS
        </h1>
      </div>

      {error && (
        <div className="fui-panel clip-angular p-4 mb-6 border-accent-amber/30">
          <div className="flex items-center gap-2">
            <span className="text-accent-amber text-sm">⚠</span>
            <span className="text-sm font-mono text-accent-amber">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <AudioRadar topTrack={topTrack} topTenAvg={topTenAvg} loading={loading} />

        {/* Track Details Panel */}
        <div className="fui-panel clip-angular p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 bg-accent-fuchsia" />
            <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em]">TOP 1 // SIGNAL DETAILS</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-4 w-full" />
              ))}
            </div>
          ) : topTrackInfo ? (
            <div>
              {/* Album Art & Title */}
              <div className="flex items-start gap-4 mb-6">
                {topTrackInfo.album?.images?.[0]?.url && (
                  <img
                    src={topTrackInfo.album.images[0].url}
                    alt={topTrackInfo.album.name}
                    className="w-28 h-28 clip-angular object-cover border border-accent-fuchsia/30 shadow-neon-fuchsia"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-accent-fuchsia tracking-wider mb-1">#01 — TOP TRACK</p>
                  <h2 className="text-xl font-display font-bold text-white mb-1 truncate">
                    {topTrackInfo.name}
                  </h2>
                  <p className="text-sm font-mono text-slate-400 truncate">
                    {topTrackInfo.artists?.map(a => a.name).join(', ')}
                  </p>
                  <p className="text-[11px] font-mono text-slate-600 mt-1">
                    {topTrackInfo.album?.name}
                  </p>
                </div>
              </div>

              {/* Feature Breakdown */}
              {topTrack && (
                <div className="space-y-3">
                  <div className="h-[1px] bg-gradient-to-r from-accent-fuchsia/20 to-transparent mb-4" />
                  {[
                    { key: 'danceability', label: 'DANCEABILITY', color: 'fuchsia' },
                    { key: 'energy', label: 'ENERGY', color: 'red' },
                    { key: 'valence', label: 'VALENCE', color: 'cyan' },
                    { key: 'acousticness', label: 'ACOUSTICNESS', color: 'amber' },
                    { key: 'instrumentalness', label: 'INSTRUMENTALNESS', color: 'cyan' },
                    { key: 'speechiness', label: 'SPEECHINESS', color: 'fuchsia' },
                  ].map(({ key, label, color }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono text-slate-500 tracking-widest">{label}</span>
                        <span className={`text-[11px] font-mono text-accent-${color} font-bold`}>
                          {((topTrack[key] || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-[3px] bg-slate-mid rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${(topTrack[key] || 0) * 100}%`,
                            background: color === 'fuchsia' ? '#d946ef'
                              : color === 'cyan' ? '#38bdf8'
                              : color === 'red' ? '#f43f5e'
                              : '#f59e0b',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <span className="text-sm font-mono text-slate-500">AWAITING DATA...</span>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 fui-panel clip-angular-sm p-4">
        <div className="flex flex-wrap gap-6 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-[2px] bg-accent-fuchsia" />
            <span>TOP 1 — Your most played track</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-[2px] bg-accent-cyan" />
            <span>TOP 10 AVG — Average of your top 10 tracks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent-amber">⚡</span>
            <span>Higher values = more of that characteristic</span>
          </div>
        </div>
      </div>
    </div>
  );
}
