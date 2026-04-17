import {
  ScatterChart,
  Scatter,
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
    <div className="fui-panel clip-angular-sm p-3 text-xs font-mono max-w-[200px]">
      <p className="text-white font-bold truncate mb-1">{data.name}</p>
      <p className="text-slate-400 truncate mb-2">{data.artist}</p>
      <div className="flex items-center gap-3">
        <span className="text-accent-cyan">VAL: {(data.valence * 100).toFixed(0)}%</span>
        <span className="text-accent-fuchsia">ENR: {(data.energy * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

function GlowDot(props) {
  const { cx, cy } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="rgba(56, 189, 248, 0.15)" />
      <circle cx={cx} cy={cy} r={5} fill="rgba(56, 189, 248, 0.4)" />
      <circle cx={cx} cy={cy} r={3} fill="#38bdf8" />
    </g>
  );
}

export default function AudioScatter({ scatterData = [], loading = false }) {
  if (loading) {
    return (
      <div className="fui-panel clip-angular p-6 flex items-center justify-center h-[350px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border border-accent-fuchsia/30 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 border border-accent-cyan/50 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          <span className="text-[10px] font-mono text-slate-500 tracking-widest">MAPPING COORDINATES...</span>
        </div>
      </div>
    );
  }

  if (!scatterData.length) {
    return (
      <div className="fui-panel clip-angular p-6 flex items-center justify-center h-[350px]">
        <span className="text-[11px] font-mono text-slate-500 tracking-wider">NO SCATTER DATA AVAILABLE</span>
      </div>
    );
  }

  return (
    <div className="fui-panel clip-angular p-4">
      <div className="flex items-center gap-2 mb-2 px-2">
        <span className="w-1.5 h-1.5 bg-accent-fuchsia" />
        <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em]">VALENCE × ENERGY // SCATTER MAP</span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.08)" />
          <XAxis
            type="number"
            dataKey="valence"
            name="Valence"
            domain={[0, 1]}
            tickCount={6}
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'VALENCE →', position: 'bottom', offset: 0, style: { fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' } }}
          />
          <YAxis
            type="number"
            dataKey="energy"
            name="Energy"
            domain={[0, 1]}
            tickCount={6}
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'ENERGY ↑', angle: -90, position: 'left', offset: 0, style: { fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(217, 70, 239, 0.3)' }} />
          <Scatter name="Tracks" data={scatterData} shape={<GlowDot />}>
            {scatterData.map((_, i) => (
              <Cell key={i} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
