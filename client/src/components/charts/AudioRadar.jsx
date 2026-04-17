import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="fui-panel clip-angular-sm p-3 text-xs font-mono">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="text-white font-bold">{entry.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

/**
 * PopularityRadar — Renders a radar chart comparing genre concentration
 * across multiple time ranges using top artist data.
 *
 * Props:
 *   genreRadarData: Array<{ genre, short_term, medium_term, long_term }>
 *   loading: boolean
 */
export default function AudioRadar({ genreRadarData = [], loading = false }) {
  if (loading) {
    return (
      <div className="fui-panel clip-angular p-6 aspect-square flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 border border-accent-cyan/30 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 border border-accent-fuchsia/50 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <span className="text-[10px] font-mono text-slate-500 tracking-widest">SCANNING FREQUENCIES...</span>
        </div>
      </div>
    );
  }

  if (!genreRadarData.length) {
    return (
      <div className="fui-panel clip-angular p-6 aspect-square flex items-center justify-center">
        <span className="text-[11px] font-mono text-slate-500 tracking-wider">NO GENRE DATA AVAILABLE</span>
      </div>
    );
  }

  return (
    <div className="fui-panel clip-angular p-4">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-accent-cyan" />
          <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em]">GENRE FREQUENCY RADAR</span>
        </div>
        <span className="text-[9px] font-mono text-accent-cyan/50 tracking-wider">TOP GENRES BY TIME RANGE</span>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={genreRadarData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="rgba(56, 189, 248, 0.1)" />
          <PolarAngleAxis dataKey="genre" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="4 WEEKS" dataKey="short_term" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} strokeWidth={2} />
          <Radar name="6 MONTHS" dataKey="medium_term" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} strokeWidth={2} />
          <Radar name="ALL TIME" dataKey="long_term" stroke="#d946ef" fill="#d946ef" fillOpacity={0.1} strokeWidth={2} />
          <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#94a3b8' }} />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
