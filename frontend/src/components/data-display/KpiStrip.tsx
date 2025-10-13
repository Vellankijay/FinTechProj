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
        <Card key={metric.id} className="glass-panel p-5 hover:scale-105 hover:shadow-2xl hover:border-blue-500/50 transition-all duration-200 cursor-pointer border-2">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{metric.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
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
                  'flex items-center gap-1.5 text-sm font-semibold',
                  metric.trend === 'up' && 'text-green-500',
                  metric.trend === 'down' && 'text-red-500',
                  metric.trend === 'neutral' && 'text-muted-foreground'
                )}
              >
                {metric.trend === 'up' && <ArrowUp className="h-5 w-5" />}
                {metric.trend === 'down' && <ArrowDown className="h-5 w-5" />}
                {metric.trend === 'neutral' && <Minus className="h-5 w-5" />}
                <span className="text-base">{Math.abs(metric.change).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
