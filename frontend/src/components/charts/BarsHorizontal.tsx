import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import type { VaRDistribution } from '@/types';

interface BarsHorizontalProps {
  data: VaRDistribution[];
  title?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="glass-panel p-3 border border-border rounded-lg shadow-xl">
      <div className="space-y-2">
        <div className="font-semibold text-foreground">{data.bucket}</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: data.color }} />
          <span className="text-sm text-foreground font-medium">{data.count} positions</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {data.percentage.toFixed(1)}% of total
        </div>
      </div>
    </div>
  );
};

export function BarsHorizontal({ data, title }: BarsHorizontalProps) {
  return (
    <div className="w-full h-full">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            stroke="hsl(var(--muted-foreground))"
            label={{ value: 'Count', position: 'insideBottom', offset: -5, style: { fill: 'hsl(var(--muted-foreground))' } }}
          />
          <YAxis type="category" dataKey="bucket" stroke="hsl(var(--muted-foreground))" width={70} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent) / 0.1)' }} />
          <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" />
          <Bar dataKey="count" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
