import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TimeSeriesPoint } from '@/types';

interface TimeSeriesProps {
  data: TimeSeriesPoint[];
  color?: string;
  showGrid?: boolean;
}

export function TimeSeries({ data, color = '#3b82f6', showGrid = true }: TimeSeriesProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
        <XAxis
          dataKey="timestamp"
          tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickFormatter={(value) => value.toFixed(2)}
        />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleString()}
          formatter={(value: number) => [value.toFixed(2), 'Price']}
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '2px solid #3b82f6',
            borderRadius: '0.5rem',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          }}
          labelStyle={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '700',
            marginBottom: '8px',
          }}
          itemStyle={{
            color: '#ffffff',
            fontSize: '13px',
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff', fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
