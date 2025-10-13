import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LimitBadgeProps {
  value: number;
  limit: number;
  className?: string;
}

export default function LimitBadge({ value, limit, className }: LimitBadgeProps) {
  const percentage = (value / limit) * 100;

  let variant: 'success' | 'warning' | 'destructive' = 'success';
  if (percentage >= 100) variant = 'destructive';
  else if (percentage >= 80) variant = 'warning';

  return (
    <Badge variant={variant} className={cn('font-mono', className)}>
      {percentage.toFixed(0)}% of limit
    </Badge>
  );
}
