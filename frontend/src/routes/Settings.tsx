import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useFiltersStore } from '@/store/useFiltersStore';
import { toast } from '@/lib/hooks/use-toast';

export default function Settings() {
  const { theme, setTheme, mockLiveEnabled, setMockLiveEnabled, density, setDensity } = useSettingsStore();
  const { resetFilters } = useFiltersStore();

  const handleResetFilters = () => {
    resetFilters();
    toast({
      title: 'Filters Reset',
      description: 'All filters have been reset to defaults.',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure risk thresholds, appearance, and data sources
          </p>
        </div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-semibold mb-6">Appearance</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred color scheme
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Light</span>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                  <span className="text-sm text-muted-foreground">Dark</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Density</p>
                  <p className="text-sm text-muted-foreground">
                    Adjust spacing and component sizes
                  </p>
                </div>
                <Select value={density} onValueChange={(v) => setDensity(v as typeof density)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-semibold mb-6">Data Streaming</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mock Live Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Enable real-time mock data updates (600-800ms interval)
                  </p>
                </div>
                <Switch
                  checked={mockLiveEnabled}
                  onCheckedChange={setMockLiveEnabled}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-semibold mb-6">Filters</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reset All Filters</p>
                  <p className="text-sm text-muted-foreground">
                    Clear all applied filters in Visual page
                  </p>
                </div>
                <Button variant="outline" onClick={handleResetFilters}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-semibold mb-6">Data Integration</h2>
            <div className="rounded-lg border border-dashed p-4 space-y-2">
              <p className="text-sm font-medium">Future Integration Points</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>
                  <strong>Kaggle CSV:</strong> Load historical price data (schema: date, symbol,
                  open, high, low, close, volume)
                </li>
                <li>
                  <strong>Yahoo Finance:</strong> Real-time OHLCV via API
                </li>
                <li>
                  <strong>News Sentiment:</strong> NYTimes/Bloomberg for alerts feed
                </li>
                <li>
                  <strong>WebSocket:</strong> Replace mock stream with real backend WS
                </li>
              </ul>
              <p className="text-sm text-muted-foreground pt-2">
                See <code className="font-mono text-xs">src/lib/data/adapters.ts</code> to wire
                real data
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
