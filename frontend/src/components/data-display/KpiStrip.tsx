import { Card } from '@/components/ui/card';
import type { KpiMetric } from '@/types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface KpiStripProps {
  metrics: KpiMetric[];
}

export function KpiStrip({ metrics }: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.id} className="glass-panel p-4 hover:scale-[1.02] transition-transform">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">{metric.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {metric.unit === '$'
                  ? formatCurrency(metric.value, 0)
                  : metric.unit === '%'
                  ? formatPercent(metric.value, 2)
                  : formatNumber(metric.value, 2)}
              </span>
            </div>
            {metric.change !== undefined && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm',
                  metric.trend === 'up' && 'text-green-500',
                  metric.trend === 'down' && 'text-red-500',
                  metric.trend === 'neutral' && 'text-muted-foreground'
                )}
              >
                {metric.trend === 'up' && <ArrowUp className="h-4 w-4" />}
                {metric.trend === 'down' && <ArrowDown className="h-4 w-4" />}
                {metric.trend === 'neutral' && <Minus className="h-4 w-4" />}
                <span>{Math.abs(metric.change).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
