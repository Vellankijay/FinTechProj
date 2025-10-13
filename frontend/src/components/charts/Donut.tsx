import { PieChart, Pie, Cell, ResponsiveContainer, Legend as RechartsLegend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface DonutProps {
  data: Array<{ name: string; value: number; percentage: number }>;
  centerLabel?: string;
  centerValue?: string;
}

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#a855f7', '#64748b'];

export function Donut({ data, centerLabel, centerValue }: DonutProps) {
  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={3}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value, 0)}
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '2px solid #3b82f6',
              borderRadius: '0.5rem',
              color: '#ffffff',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            }}
            labelStyle={{
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '14px',
            }}
            itemStyle={{
              color: '#ffffff',
              fontSize: '13px',
            }}
          />
          <RechartsLegend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string, entry: any) => (
              <span className="text-sm text-foreground">
                {value}: {entry.payload.percentage.toFixed(1)}%
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && centerValue && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: '36px' }}>
          <div className="text-center">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{centerLabel}</div>
            <div className="text-3xl font-bold text-foreground mt-1">{centerValue}</div>
          </div>
        </div>
      )}
    </div>
  );
}
