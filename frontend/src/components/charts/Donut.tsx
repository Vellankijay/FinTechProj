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
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value, 0)}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{centerLabel}</div>
            <div className="text-2xl font-bold">{centerValue}</div>
          </div>
        </div>
      )}
    </div>
  );
}
