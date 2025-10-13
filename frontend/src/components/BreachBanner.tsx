import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface BreachBannerProps {
  breaches: { type: string; value: number; limit: number }[];
  onDismiss: () => void;
}

export default function BreachBanner({ breaches, onDismiss }: BreachBannerProps) {
  if (breaches.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="sticky top-16 z-40 border-b border-destructive/50 bg-destructive/10 backdrop-blur-sm"
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">
                {breaches.length} Active Breach{breaches.length > 1 ? 'es' : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                {breaches.map((b) => `${b.type}: ${formatCurrency(b.value)}`).join(' | ')}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            aria-label="Dismiss breach banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
