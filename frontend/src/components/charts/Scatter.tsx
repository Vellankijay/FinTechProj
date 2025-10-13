import { ScatterChart, Scatter as RechartsScatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine } from 'recharts';
import type { ScatterPoint } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface ScatterProps {
  data: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  showRegression?: boolean;
}

function calculateRegression(data: ScatterPoint[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const sumX = data.reduce((sum, d) => sum + d.x, 0);
  const sumY = data.reduce((sum, d) => sum + d.y, 0);
  const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
  const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export function Scatter({ data, xLabel = 'X Axis', yLabel = 'Y Axis', showRegression = true }: ScatterProps) {
  const { slope, intercept } = showRegression ? calculateRegression(data) : { slope: 0, intercept: 0 };

  const xMin = Math.min(...data.map((d) => d.x));
  const xMax = Math.max(...data.map((d) => d.x));

  const regressionLine = showRegression
    ? [
        { x: xMin, y: slope * xMin + intercept },
        { x: xMax, y: slope * xMax + intercept },
      ]
    : [];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          label={{ value: xLabel, position: 'insideBottom', offset: -10, style: { fill: 'hsl(var(--muted-foreground))' } }}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
          stroke="hsl(var(--muted-foreground))"
        />
        <ZAxis type="number" dataKey="size" range={[50, 500]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value: any, name: string) => {
            if (name === 'x') return [formatCurrency(value, 0), xLabel];
            if (name === 'y') return [formatPercent(value, 2), yLabel];
            return [value, name];
          }}
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
        />
        <RechartsScatter data={data} fill="#3b82f6">
          {data.map((entry, index) => (
            <circle key={`dot-${index}`} r={6} fill={entry.color} />
          ))}
        </RechartsScatter>
        {showRegression && regressionLine.length > 0 && (
          <RechartsScatter data={regressionLine} line={{ stroke: '#ef4444', strokeWidth: 2 }} shape={<></>} />
        )}
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
        <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
