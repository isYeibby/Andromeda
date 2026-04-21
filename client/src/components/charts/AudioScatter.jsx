import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="fui-panel clip-angular-sm p-3 text-xs font-mono max-w-[220px]">
      <p className="text-white font-bold truncate mb-1">{data.name}</p>
      <p className="text-slate-400 truncate mb-2">{data.artist}</p>
      <div className="flex items-center gap-3">
        <span className="text-accent-cyan">ENERGY: {data.energy}%</span>
        <span className="text-accent-fuchsia">{data.duration}</span>
      </div>
    </div>
  );
}

function getBarColor(energy) {
  if (energy >= 80) return '#f43f5e';      // intense
  if (energy >= 60) return '#d946ef';      // high
  if (energy >= 40) return '#38bdf8';      // medium
  return '#64748b';                        // calm
}

/**
 * PopularityChart — Bar chart showing track popularity scores
 *
 * Props:
 *   chartData: Array<{ name, artist, popularity, duration }>
 *   loading: boolean
 */
export default function AudioScatter({ chartData = [], loading = false }) {
  if (loading) {
    return (
      <div className="fui-panel clip-angular p-6 flex items-center justify-center h-[350px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border border-accent-fuchsia/30 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 border border-accent-cyan/50 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          <span className="text-[10px] font-mono text-slate-500 tracking-widest">COMPUTING METRICS...</span>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="fui-panel clip-angular p-6 flex items-center justify-center h-[350px]">
        <span className="text-[11px] font-mono text-slate-500 tracking-wider">NO ENERGY DATA AVAILABLE</span>
      </div>
    );
  }

  return (
    <div className="fui-panel clip-angular p-4">
      <div className="flex items-center gap-2 mb-2 px-2">
        <span className="w-1.5 h-1.5 bg-accent-fuchsia" />
        <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em]">ENERGY INDEX // TOP TRACKS</span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.08)" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            tickCount={6}
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'ENERGY ↑', angle: -90, position: 'insideLeft', offset: 0, style: { fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(217, 70, 239, 0.06)' }} />
          <Bar dataKey="energy" radius={[2, 2, 0, 0]} maxBarSize={40} minPointSize={4}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getBarColor(entry.energy)} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2 px-2 text-[9px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#f43f5e' }} />
          <span>80-100 INTENSE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#d946ef' }} />
          <span>60-79 HIGH</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#38bdf8' }} />
          <span>40-59 MEDIUM</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#64748b' }} />
          <span>0-39 CALM</span>
        </div>
      </div>
    </div>
  );
}
