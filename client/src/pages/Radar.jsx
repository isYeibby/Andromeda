import { useEffect, useState, useRef } from 'react';
import { useSpotify } from '../hooks/useSpotify';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';

// =============================================
// DATA PROCESSING ALGORITHMS
// =============================================

/**
 * processTopGenres — Genre Frequency Algorithm
 *
 * Extracts the `genres` array from each artist object,
 * uses reduce() to count how many times each genre appears,
 * then sorts descending and returns the top N genres.
 *
 * @param {Array} artists  Array of Spotify artist objects (each has .genres[])
 * @param {number} topN    How many top genres to return (default: 5)
 * @returns {Array<{genre: string, count: number, fullGenre: string}>}
 */
function processTopGenres(artists, topN = 5) {
  // Step 1: Flatten all genre arrays and count frequency with reduce()
  const genreCounts = artists.reduce((acc, artist) => {
    (artist.genres || []).forEach((genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
    });
    return acc;
  }, {});

  // Step 2: Convert to array, sort by count descending, take top N
  const sorted = Object.entries(genreCounts)
    .map(([genre, count]) => ({
      // Capitalize and truncate for chart display
      genre: genre.toUpperCase().replace(/-/g, ' ').slice(0, 18),
      fullGenre: genre,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  return sorted;
}

/**
 * processActivityByHour — Hourly Listening Frequency Algorithm
 *
 * Parses the `played_at` timestamp from each recently-played item,
 * extracts the hour (0-23), and builds a histogram.
 * Also classifies into day blocks (Madrugada, Mañana, Tarde, Noche).
 *
 * @param {Array} recentItems  Array of { played_at, track } objects
 * @returns {{
 *   hourlyData: Array<{hour: string, count: number}>,
 *   blocks: {MADRUGADA: number, MAÑANA: number, TARDE: number, NOCHE: number},
 *   peakBlock: string
 * }}
 */
function processActivityByHour(recentItems) {
  // Initialize 24 hour slots
  const hourCounts = new Array(24).fill(0);

  // Day block definitions
  const blocks = {
    MADRUGADA: 0,  // 00:00 - 05:59
    MAÑANA: 0,     // 06:00 - 11:59
    TARDE: 0,      // 12:00 - 17:59
    NOCHE: 0,      // 18:00 - 23:59
  };

  // Step 1: Parse each played_at timestamp and count by hour
  recentItems.forEach((item) => {
    const date = new Date(item.played_at);
    const hour = date.getHours();
    hourCounts[hour]++;

    // Classify into block
    if (hour >= 0 && hour < 6) blocks.MADRUGADA++;
    else if (hour >= 6 && hour < 12) blocks.MAÑANA++;
    else if (hour >= 12 && hour < 18) blocks.TARDE++;
    else blocks.NOCHE++;
  });

  // Step 2: Build chart data array (24 data points)
  const hourLabels = [
    '00', '01', '02', '03', '04', '05',
    '06', '07', '08', '09', '10', '11',
    '12', '13', '14', '15', '16', '17',
    '18', '19', '20', '21', '22', '23',
  ];

  const hourlyData = hourLabels.map((label, i) => ({
    hour: `${label}h`,
    count: hourCounts[i],
  }));

  // Step 3: Determine peak block
  const peakBlock = Object.entries(blocks).sort((a, b) => b[1] - a[1])[0][0];

  return { hourlyData, blocks, peakBlock };
}

/**
 * findDominantArtist — Most frequent artist in recently played
 *
 * @param {Array} recentItems  Array of { track } objects
 * @returns {{name: string, count: number, image: string} | null}
 */
function findDominantArtist(recentItems) {
  const artistCounts = {};
  const artistMeta = {};

  recentItems.forEach((item) => {
    const artists = item.track?.artists || [];
    artists.forEach((artist) => {
      artistCounts[artist.id] = (artistCounts[artist.id] || 0) + 1;
      if (!artistMeta[artist.id]) {
        artistMeta[artist.id] = { name: artist.name };
      }
    });
  });

  const sorted = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return null;

  const [id, count] = sorted[0];
  return { name: artistMeta[id].name, count };
}

/**
 * findMostRepeatedTrack — Track with most appearances in recently played
 *
 * @param {Array} recentItems  Array of { track } objects
 * @returns {{name: string, artist: string, count: number} | null}
 */
function findMostRepeatedTrack(recentItems) {
  const trackCounts = {};
  const trackMeta = {};

  recentItems.forEach((item) => {
    const track = item.track;
    if (!track) return;
    trackCounts[track.id] = (trackCounts[track.id] || 0) + 1;
    if (!trackMeta[track.id]) {
      trackMeta[track.id] = {
        name: track.name,
        artist: track.artists?.map((a) => a.name).join(', ') || '',
      };
    }
  });

  const sorted = Object.entries(trackCounts).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return null;

  const [id, count] = sorted[0];
  return { ...trackMeta[id], count };
}

// =============================================
// DEV CACHE — Prevents 429 during Vite HMR
// =============================================

const CACHE_KEY = 'andromeda_analytics_cache';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getCachedData() {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return data;
    sessionStorage.removeItem(CACHE_KEY);
  } catch { /* ignore */ }
  return null;
}

function setCachedData(data) {
  if (!import.meta.env.DEV) return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
}

// =============================================
// CUSTOM RECHARTS COMPONENTS
// =============================================

/** FUI-styled tooltip for bar chart */
function GenreTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="fui-panel clip-angular-sm p-3 text-xs font-mono">
      <p className="text-white font-bold mb-1">{data.fullGenre || data.genre}</p>
      <p className="text-accent-cyan">
        FREQ: {data.count} {data.count === 1 ? 'artist' : 'artists'}
      </p>
    </div>
  );
}

/** FUI-styled tooltip for area chart */
function ActivityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="fui-panel clip-angular-sm p-3 text-xs font-mono">
      <p className="text-slate-400">{label}</p>
      <p className="text-accent-fuchsia font-bold">
        {payload[0].value} {payload[0].value === 1 ? 'track' : 'tracks'}
      </p>
    </div>
  );
}

// =============================================
// MAIN COMPONENT
// =============================================

export default function Radar() {
  const { getTopItems, getRecentlyPlayed } = useSpotify();

  // ── State ──
  const [topGenres, setTopGenres] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [peakBlock, setPeakBlock] = useState('—');
  const [dominantArtist, setDominantArtist] = useState(null);
  const [repeatedTrack, setRepeatedTrack] = useState(null);
  const [topArtistName, setTopArtistName] = useState(null);
  const [totalPlays, setTotalPlays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Prevent StrictMode double-fetch ──
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const controller = new AbortController();

    async function load() {
      try {
        // ── Check dev cache first ──
        const cached = getCachedData();
        if (cached) {
          console.log('[ANALYTICS] Using cached data (dev mode)');
          applyData(cached.topArtists, cached.recentlyPlayed);
          setLoading(false);
          return;
        }

        // ── Fetch ONLY 2 endpoints (rate-limit safe) ──
        const [topArtistsRes, recentlyPlayedRes] = await Promise.all([
          getTopItems('artists', 'medium_term', 50),
          getRecentlyPlayed(50),
        ]);

        const topArtists = topArtistsRes.items || [];
        const recentlyPlayed = recentlyPlayedRes.items || [];

        // Cache for dev HMR protection
        setCachedData({ topArtists, recentlyPlayed });

        applyData(topArtists, recentlyPlayed);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[ANALYTICS] Load error:', err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    function applyData(topArtists, recentlyPlayed) {
      // ── Genre processing ──
      const genres = processTopGenres(topArtists, 5);
      setTopGenres(genres);

      // ── Activity processing ──
      const activity = processActivityByHour(recentlyPlayed);
      setHourlyData(activity.hourlyData);
      setPeakBlock(activity.peakBlock);

      // ── Metrics ──
      const dominant = findDominantArtist(recentlyPlayed);
      setDominantArtist(dominant);

      const repeated = findMostRepeatedTrack(recentlyPlayed);
      setRepeatedTrack(repeated);

      // Top #1 artist name from the top artists API
      if (topArtists.length > 0) {
        setTopArtistName(topArtists[0].name);
      }

      setTotalPlays(recentlyPlayed.length);
    }

    load();

    return () => controller.abort();
  }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="pt-20 pb-24 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-2 border-accent-fuchsia border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono text-slate-400 tracking-wider">
            PROCESSING CONSUMPTION DATA...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-24 px-4 max-w-7xl mx-auto animate-fade-in">
      {/* ═══ Header ═══ */}
      <div className="flex items-center gap-2 mb-8">
        <span className="w-1.5 h-1.5 bg-accent-cyan" />
        <h1 className="text-[11px] font-mono text-slate-400 tracking-[0.2em]">
          CONSUMPTION // ANALYTICS
        </h1>
      </div>

      {/* ═══ Error ═══ */}
      {error && (
        <div className="fui-panel clip-angular p-4 mb-6 border-accent-rose/30">
          <div className="flex items-center gap-2">
            <span className="text-accent-rose text-sm">⚠</span>
            <span className="text-sm font-mono text-accent-rose">{error}</span>
          </div>
        </div>
      )}

      {/* ═══ FUI METRIC CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {/* Dominant Artist */}
        <div className="fui-panel clip-angular p-4 group hover:border-accent-fuchsia/30 transition-colors">
          <span className="text-[9px] font-mono text-slate-500 tracking-widest block mb-2">
            ARTISTA_DOMINANTE
          </span>
          <p className="text-base font-display font-bold text-accent-fuchsia truncate text-glow-fuchsia">
            {dominantArtist?.name || '—'}
          </p>
          {dominantArtist?.count && (
            <span className="text-[10px] font-mono text-slate-600 mt-1 block">
              {dominantArtist.count} plays recientes
            </span>
          )}
        </div>

        {/* Most Repeated Track */}
        <div className="fui-panel clip-angular p-4 group hover:border-accent-cyan/30 transition-colors">
          <span className="text-[9px] font-mono text-slate-500 tracking-widest block mb-2">
            TRACK_MAS_REPETIDO
          </span>
          <p className="text-base font-display font-bold text-accent-cyan truncate text-glow-cyan">
            {repeatedTrack?.name || '—'}
          </p>
          {repeatedTrack?.artist && (
            <span className="text-[10px] font-mono text-slate-600 mt-1 block truncate">
              {repeatedTrack.artist}
            </span>
          )}
        </div>

        {/* Primary Genre */}
        <div className="fui-panel clip-angular p-4 group hover:border-accent-rose/30 transition-colors">
          <span className="text-[9px] font-mono text-slate-500 tracking-widest block mb-2">
            GENERO_PRIMARIO
          </span>
          <p className="text-base font-display font-bold text-accent-rose truncate text-glow-rose">
            {topGenres[0]?.genre || '—'}
          </p>
          {topGenres[0]?.count && (
            <span className="text-[10px] font-mono text-slate-600 mt-1 block">
              {topGenres[0].count} artistas
            </span>
          )}
        </div>

        {/* Peak Activity Block */}
        <div className="fui-panel clip-angular p-4 group hover:border-accent-fuchsia/30 transition-colors">
          <span className="text-[9px] font-mono text-slate-500 tracking-widest block mb-2">
            BLOQUE_ACTIVO
          </span>
          <p className="text-base font-display font-bold text-accent-fuchsia truncate text-glow-fuchsia">
            {peakBlock}
          </p>
          <span className="text-[10px] font-mono text-slate-600 mt-1 block">
            {totalPlays} señales analizadas
          </span>
        </div>
      </div>

      {/* ═══ CHARTS GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── TOP 5 GENRES — Horizontal Bar Chart ─── */}
        <div className="fui-panel clip-angular p-4">
          <div className="flex items-center gap-2 mb-4 px-2">
            <span className="w-1.5 h-1.5 bg-accent-cyan" />
            <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em]">
              TOP GENRES // FREQUENCY MAP
            </span>
          </div>

          {topGenres.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={topGenres}
                layout="vertical"
                margin={{ top: 5, right: 30, bottom: 5, left: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(56, 189, 248, 0.08)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{
                    fill: '#64748b',
                    fontSize: 10,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                  axisLine={{ stroke: 'rgba(56, 189, 248, 0.15)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="genre"
                  width={120}
                  tick={{
                    fill: '#94a3b8',
                    fontSize: 10,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                  axisLine={{ stroke: 'rgba(56, 189, 248, 0.15)' }}
                  tickLine={false}
                />
                <Tooltip content={<GenreTooltip />} cursor={{ fill: 'rgba(56, 189, 248, 0.06)' }} />
                <Bar dataKey="count" radius={0} maxBarSize={28} minPointSize={4}>
                  {topGenres.map((_, i) => (
                    <Cell
                      key={i}
                      fill="#38bdf8"
                      fillOpacity={0.85 - i * 0.1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px]">
              <span className="text-[11px] font-mono text-slate-500 tracking-wider">
                NO GENRE DATA AVAILABLE
              </span>
            </div>
          )}
        </div>

        {/* ─── LISTENING ACTIVITY — Area Chart ─── */}
        <div className="fui-panel clip-angular p-4">
          <div className="flex items-center gap-2 mb-4 px-2">
            <span className="w-1.5 h-1.5 bg-accent-fuchsia" />
            <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em]">
              ACTIVIDAD RECIENTE // 24H WAVEFORM
            </span>
          </div>

          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={hourlyData}
                margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
              >
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#d946ef" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(56, 189, 248, 0.08)"
                />
                <XAxis
                  dataKey="hour"
                  tick={{
                    fill: '#64748b',
                    fontSize: 9,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                  axisLine={{ stroke: 'rgba(56, 189, 248, 0.15)' }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{
                    fill: '#64748b',
                    fontSize: 10,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                  axisLine={{ stroke: 'rgba(56, 189, 248, 0.15)' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ActivityTooltip />} cursor={{ stroke: 'rgba(217, 70, 239, 0.3)' }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#d946ef"
                  strokeWidth={2}
                  fill="url(#activityGradient)"
                  dot={{
                    r: 3,
                    fill: '#d946ef',
                    stroke: '#d946ef',
                    strokeWidth: 1,
                  }}
                  activeDot={{
                    r: 5,
                    fill: '#d946ef',
                    stroke: '#020617',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px]">
              <span className="text-[11px] font-mono text-slate-500 tracking-wider">
                NO ACTIVITY DATA AVAILABLE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ EXTENDED METRICS ═══ */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Top #1 Artist (from Top Artists endpoint) */}
        <div className="fui-panel clip-angular-sm p-3 text-center">
          <span className="text-[9px] font-mono text-slate-500 tracking-widest block mb-1">
            #1 TOP ARTIST
          </span>
          <span className="text-lg font-display font-bold text-accent-fuchsia truncate block">
            {topArtistName || '—'}
          </span>
        </div>

        {/* Total Recent Plays */}
        <div className="fui-panel clip-angular-sm p-3 text-center">
          <span className="text-[9px] font-mono text-slate-500 tracking-widest block mb-1">
            SIGNALS CAPTURED
          </span>
          <span className="text-lg font-display font-bold text-accent-cyan">
            {totalPlays}
          </span>
        </div>

        {/* Unique Genres */}
        <div className="fui-panel clip-angular-sm p-3 text-center">
          <span className="text-[9px] font-mono text-slate-500 tracking-widest block mb-1">
            GENRES DETECTED
          </span>
          <span className="text-lg font-display font-bold text-accent-rose">
            {topGenres.length}
          </span>
        </div>

        {/* Peak Hour */}
        <div className="fui-panel clip-angular-sm p-3 text-center">
          <span className="text-[9px] font-mono text-slate-500 tracking-widest block mb-1">
            PEAK FREQUENCY
          </span>
          <span className="text-lg font-display font-bold text-accent-fuchsia">
            {peakBlock}
          </span>
        </div>
      </div>

      {/* ═══ LEGEND ═══ */}
      <div className="mt-6 fui-panel clip-angular-sm p-4">
        <div className="flex flex-wrap gap-6 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-[2px] bg-accent-cyan" />
            <span>GENRE FREQUENCY — From your Top 50 artists (6 months)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-[2px] bg-accent-fuchsia" />
            <span>ACTIVITY WAVEFORM — From your last 50 played tracks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent-rose">⚡</span>
            <span>Processed from real Spotify consumption data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
