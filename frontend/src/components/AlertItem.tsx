import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AlertItemProps {
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  message: string;
  timestamp: number;
  symbol?: string;
  desk?: string;
}

const severityConfig = {
  INFO: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  WARN: { icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  CRITICAL: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
};

export default function AlertItem({ severity, message, timestamp, symbol, desk }: AlertItemProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;
  const timeStr = new Date(timestamp).toLocaleTimeString();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex items-start gap-3 rounded-lg p-3', config.bgColor)}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', config.color)} />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {severity}
          </Badge>
          {symbol && (
            <span className="text-xs font-mono text-muted-foreground">{symbol}</span>
          )}
          {desk && <span className="text-xs text-muted-foreground">{desk}</span>}
        </div>
        <p className="text-sm">{message}</p>
        <p className="text-xs text-muted-foreground">{timeStr}</p>
      </div>
    </motion.div>
  );
}
