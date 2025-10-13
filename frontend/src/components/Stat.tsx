import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatProps {
  label: string;
  value: string | number;
  change?: number;
  format?: 'currency' | 'percent' | 'number';
  sparkline?: number[];
}

export default function Stat({ label, value, change, sparkline }: StatProps) {
  const isPositive = change ? change >= 0 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col space-y-1"
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {change !== undefined && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-sm font-medium',
              isPositive ? 'text-green-500' : 'text-red-500'
            )}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change).toFixed(2)}%
          </span>
        )}
      </div>
      {sparkline && sparkline.length > 0 && (
        <svg width="80" height="20" className="opacity-60">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            points={sparkline
              .map((v, i) => {
                const x = (i / (sparkline.length - 1)) * 80;
                const y = 20 - (v / Math.max(...sparkline)) * 20;
                return `${x},${y}`;
              })
              .join(' ')}
          />
        </svg>
      )}
    </motion.div>
  );
}
