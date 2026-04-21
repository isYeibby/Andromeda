import { useEffect, useState } from 'react';
import { useSpotify } from '../hooks/useSpotify';
import AudioRadar from '../components/charts/AudioRadar';
import AudioScatter from '../components/charts/AudioScatter';

function formatDuration(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Extracts top N genres from an array of artist objects and returns
 * a percentage-based distribution (how much each genre appears).
 */
function extractGenreDistribution(artists, topN = 6) {
  const genreCount = {};
  let totalGenres = 0;
  artists.forEach(artist => {
    (artist.genres || []).forEach(genre => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
      totalGenres++;
    });
  });

  if (totalGenres === 0) return [];

  return Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([genre, count]) => ({
      genre: genre.toUpperCase().replace(/-/g, ' ').slice(0, 14),
      fullGenre: genre,
      percentage: (count / totalGenres) * 100,
    }));
}

/**
 * Computes summary stats from track objects without Audio Features API.
 */
function computeTrackStats(tracks) {
  if (!tracks.length) return null;

  const popularities = tracks.map(t => t.popularity || 0);
  const durations = tracks.map(t => t.duration_ms || 0);
  const explicits = tracks.filter(t => t.explicit);

  const avgPopularity = popularities.reduce((a, b) => a + b, 0) / tracks.length;
  const maxPopularity = Math.max(...popularities);
  const minPopularity = Math.min(...popularities);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / tracks.length;
  const totalDuration = durations.reduce((a, b) => a + b, 0);

  // Decade distribution
  const decades = {};
  tracks.forEach(t => {
    const year = parseInt(t.album?.release_date?.split('-')[0]);
    if (year) {
      const decade = `${Math.floor(year / 10) * 10}s`;
      decades[decade] = (decades[decade] || 0) + 1;
    }
  });

  // Unique artists count
  const artistSet = new Set();
  tracks.forEach(t => (t.artists || []).forEach(a => artistSet.add(a.id)));

  return {
    avgPopularity: Math.round(avgPopularity),
    maxPopularity,
    minPopularity,
    avgDurationMs: avgDuration,
    totalDurationMs: totalDuration,
    explicitCount: explicits.length,
    explicitPercent: Math.round((explicits.length / tracks.length) * 100),
    uniqueArtists: artistSet.size,
    decades: Object.entries(decades).sort((a, b) => a[0].localeCompare(b[0])),
    trackCount: tracks.length,
  };
}

export default function Radar() {
  const { getTopItems, getArtists, getAudioFeatures } = useSpotify();
  const [topTrackInfo, setTopTrackInfo] = useState(null);
  const [trackStats, setTrackStats] = useState(null);
  const [genreRadarData, setGenreRadarData] = useState([]);
  const [popularityChartData, setPopularityChartData] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // Fetch all data in parallel — no Audio Features needed
        const [
          tracksShort, tracksMedium, tracksLong,
          artistsShort, artistsMedium, artistsLong,
        ] = await Promise.all([
          getTopItems('tracks', 'short_term', 20),
          getTopItems('tracks', 'medium_term', 20),
          getTopItems('tracks', 'long_term', 20),
          getTopItems('artists', 'short_term', 20),
          getTopItems('artists', 'medium_term', 20),
          getTopItems('artists', 'long_term', 20),
        ]);

        const mediumTracks = tracksMedium.items || [];
        const mediumArtists = artistsMedium.items || [];

        if (mediumTracks.length === 0) {
          setError('No hay suficientes datos todavía. ¡Escucha más música!');
          setLoading(false);
          return;
        }

        // Top track info
        setTopTrackInfo(mediumTracks[0]);

        // Track stats from medium term
        setTrackStats(computeTrackStats(mediumTracks));

        // Fetch audio features for all time ranges
        const shortTracks = tracksShort.items || [];
        const longTracks = tracksLong.items || [];
        const allTrackIds = [
          ...shortTracks.map(t => t.id),
          ...mediumTracks.map(t => t.id),
          ...longTracks.map(t => t.id)
        ].filter(Boolean);

        const uniqueTrackIds = [...new Set(allTrackIds)].slice(0, 100);
        const afMap = {};
        
        if (uniqueTrackIds.length > 0) {
          try {
            const afData = await getAudioFeatures(uniqueTrackIds);
            (afData.audio_features || []).forEach(af => {
               if (af) afMap[af.id] = af;
            });
          } catch (e) {
            console.error('[RADAR] Failed to fetch Audio Features', e);
          }
        }

        const getAverages = (tracksArray) => {
          const afs = tracksArray.map(t => afMap[t.id]).filter(Boolean);
          if (!afs.length) return { danceability: 0, energy: 0, valence: 0, acousticness: 0, instrumentalness: 0, liveness: 0 };
          const avg = (key) => afs.reduce((acc, curr) => acc + (curr[key] || 0), 0) / afs.length * 100;
          return {
            danceability: avg('danceability'),
            energy: avg('energy'),
            valence: avg('valence'),
            acousticness: avg('acousticness'),
            instrumentalness: avg('instrumentalness'),
            liveness: avg('liveness'),
          };
        };

        const shortAvg = getAverages(shortTracks);
        const mediumAvg = getAverages(mediumTracks);
        const longAvg = getAverages(longTracks);

        const audioSignatureData = [
          { feature: 'DANCEABILITY', short_term: shortAvg.danceability, medium_term: mediumAvg.danceability, long_term: longAvg.danceability },
          { feature: 'ENERGY', short_term: shortAvg.energy, medium_term: mediumAvg.energy, long_term: longAvg.energy },
          { feature: 'VALENCE', short_term: shortAvg.valence, medium_term: mediumAvg.valence, long_term: longAvg.valence },
          { feature: 'ACOUSTIC', short_term: shortAvg.acousticness, medium_term: mediumAvg.acousticness, long_term: longAvg.acousticness },
          { feature: 'INSTRUMENTAL', short_term: shortAvg.instrumentalness, medium_term: mediumAvg.instrumentalness, long_term: longAvg.instrumentalness },
          { feature: 'LIVENESS', short_term: shortAvg.liveness, medium_term: mediumAvg.liveness, long_term: longAvg.liveness },
        ];
        
        // Only show radar if we have actual audio features
        setGenreRadarData(Object.keys(afMap).length > 0 ? audioSignatureData : []);

        // Top genres: we still extract them using real data fallback
        let mediumGenres = extractGenreDistribution(mediumArtists, 8);
        if (mediumGenres.length === 0 && mediumTracks.length > 0) {
          try {
            const trackArtistIds = [...new Set(mediumTracks.flatMap(t => t.artists?.map(a => a.id) || []))].filter(Boolean).slice(0, 50);
            if (trackArtistIds.length > 0) {
              const fetchedData = await getArtists(trackArtistIds);
              const inferredGenres = extractGenreDistribution(fetchedData.artists || [], 8);
              if (inferredGenres.length > 0) mediumGenres = inferredGenres;
            }
          } catch (err) {
            console.error('[RADAR] Real-data genre fallback failed:', err);
          }
        }
        setTopGenres(mediumGenres.slice(0, 6));

        // Build Audio Feature bar chart from medium term tracks
        const chartData = mediumTracks.slice(0, 10).map((t, i) => {
          const af = afMap[t.id];
          return {
            label: `#${i + 1}`,
            name: t.name,
            artist: t.artists?.map(a => a.name).join(', ') || '',
            energy: af ? Math.round(af.energy * 100) : 0,
            duration: formatDuration(t.duration_ms),
          };
        });
        setPopularityChartData(chartData);

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
          ANALYSIS // LISTENING INTELLIGENCE
        </h1>
      </div>

      {error && (
        <div className="fui-panel clip-angular p-4 mb-6 border-accent-rose/30">
          <div className="flex items-center gap-2">
            <span className="text-accent-rose text-sm">⚠</span>
            <span className="text-sm font-mono text-accent-rose">{error}</span>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${genreRadarData.length > 0 ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Genre Radar Chart */}
        {genreRadarData.length > 0 && (
          <AudioRadar genreRadarData={genreRadarData} loading={loading} />
        )}

        {/* Track Details Panel */}
        <div className="fui-panel clip-angular p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 bg-accent-fuchsia" />
            <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em]">TOP 1 // SIGNAL PROFILE</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-4 w-full" />
              ))}
            </div>
          ) : topTrackInfo ? (
            <div>
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

              {/* Track Metrics — from track object (no Audio Features API) */}
              <div className="space-y-3">
                <div className="h-[1px] bg-gradient-to-r from-accent-fuchsia/20 to-transparent mb-4" />
                {[
                  { key: 'duration', label: 'DURATION', value: topTrackInfo.duration_ms ? Math.min((topTrackInfo.duration_ms / 600000) * 100, 100) : 0, max: 100, color: '#38bdf8', display: formatDuration(topTrackInfo.duration_ms || 0) },
                  { key: 'explicit', label: 'EXPLICIT', value: topTrackInfo.explicit ? 100 : 0, max: 100, color: '#d946ef', display: topTrackInfo.explicit ? 'YES' : 'NO' },
                  { key: 'disc', label: 'DISC / TRACK', value: ((topTrackInfo.track_number || 1) / 20) * 100, max: 100, color: '#e11d48', display: `${topTrackInfo.disc_number || 1} / ${topTrackInfo.track_number || '—'}` },
                ].map(({ label, value, color, display }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono text-slate-500 tracking-widest">{label}</span>
                      <span className="text-[11px] font-mono font-bold" style={{ color }}>
                        {display || `${Math.round(value)}%`}
                      </span>
                    </div>
                    <div className="h-[3px] bg-slate-mid rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${value}%`, background: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <span className="text-sm font-mono text-slate-500">AWAITING DATA...</span>
            </div>
          )}
        </div>
      </div>

      {/* Popularity Bar Chart */}
      <div className="mt-6">
        <AudioScatter chartData={popularityChartData} loading={loading} />
      </div>

      {/* Stats Grid */}
      {trackStats && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'UNIQUE ARTISTS', value: trackStats.uniqueArtists, color: 'text-accent-fuchsia' },
            { label: 'EXPLICIT', value: `${trackStats.explicitPercent}%`, color: 'text-accent-rose' },
            { label: 'AVG DURATION', value: formatDuration(trackStats.avgDurationMs), color: 'text-accent-cyan' },
            { label: 'TOTAL TIME', value: `${Math.round(trackStats.totalDurationMs / 60000)}m`, color: 'text-accent-fuchsia' },
          ].map(({ label, value, color }) => (
            <div key={label} className="fui-panel clip-angular-sm p-3 text-center">
              <span className="text-[9px] font-mono text-slate-500 tracking-widest block mb-1">{label}</span>
              <span className={`text-lg font-display font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Decade Distribution + Top Genres */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decade Distribution */}
        {trackStats?.decades?.length > 0 && (
          <div className="fui-panel clip-angular p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 bg-accent-cyan" />
              <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em]">DECADE DISTRIBUTION</span>
            </div>
            <div className="space-y-2">
              {trackStats.decades.map(([decade, count]) => {
                const pct = (count / trackStats.trackCount) * 100;
                return (
                  <div key={decade}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-400 tracking-wider">{decade}</span>
                      <span className="text-[10px] font-mono text-accent-cyan font-bold">{count} tracks ({Math.round(pct)}%)</span>
                    </div>
                    <div className="h-[4px] bg-slate-mid rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-accent-cyan to-accent-fuchsia"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Genres */}
        {topGenres.length > 0 && (
          <div className="fui-panel clip-angular p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 bg-accent-fuchsia" />
              <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em]">TOP GENRES // 6 MONTHS</span>
            </div>
            <div className="space-y-2">
              {topGenres.map((g, i) => {
                const colors = ['#f43f5e', '#d946ef', '#38bdf8', '#e11d48', '#d946ef', '#38bdf8'];
                const color = colors[i % colors.length];
                return (
                  <div key={g.fullGenre}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-400 tracking-wider">{g.genre}</span>
                      <span className="text-[10px] font-mono font-bold" style={{ color }}>{g.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-[4px] bg-slate-mid rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${g.percentage}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 fui-panel clip-angular-sm p-4">
        <div className="flex flex-wrap gap-6 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-[2px] bg-accent-cyan" />
            <span>ENERGY — Intensity and activity measure (0-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-[2px] bg-accent-fuchsia" />
            <span>AUDIO SIGNATURE — Spotify DSP feature analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent-rose">⚡</span>
            <span>Calculated from your unique listening streams</span>
          </div>
        </div>
      </div>
    </div>
  );
}
