import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Card from '@/components/Card';
import { storage, STORAGE_DEFAULTS } from '@/lib/storage';
import { toast } from '@/lib/hooks/use-toast';

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    storage.get('theme') || STORAGE_DEFAULTS.theme
  );
  const [density, setDensity] = useState<'comfortable' | 'compact'>(
    storage.get('density') || STORAGE_DEFAULTS.density
  );
  const [drawdownThreshold, setDrawdownThreshold] = useState<number[]>([
    (storage.get('drawdownThreshold') || STORAGE_DEFAULTS.drawdownThreshold) * 100,
  ]);
  const [volZScore, setVolZScore] = useState<number[]>([
    storage.get('volZScoreThreshold') || STORAGE_DEFAULTS.volZScoreThreshold,
  ]);
  const [varAlpha, setVarAlpha] = useState<number[]>([
    (storage.get('varAlpha') || STORAGE_DEFAULTS.varAlpha) * 100,
  ]);
  const [apiBaseUrl, setApiBaseUrl] = useState(
    storage.get('apiBaseUrl') || STORAGE_DEFAULTS.apiBaseUrl
  );

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleSave = () => {
    storage.set('theme', theme);
    storage.set('density', density);
    storage.set('drawdownThreshold', drawdownThreshold[0] / 100);
    storage.set('volZScoreThreshold', volZScore[0]);
    storage.set('varAlpha', varAlpha[0] / 100);
    storage.set('apiBaseUrl', apiBaseUrl);

    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been saved successfully.',
    });
  };

  const handleReset = () => {
    setTheme(STORAGE_DEFAULTS.theme);
    setDensity(STORAGE_DEFAULTS.density);
    setDrawdownThreshold([STORAGE_DEFAULTS.drawdownThreshold * 100]);
    setVolZScore([STORAGE_DEFAULTS.volZScoreThreshold]);
    setVarAlpha([STORAGE_DEFAULTS.varAlpha * 100]);
    setApiBaseUrl(STORAGE_DEFAULTS.apiBaseUrl);

    toast({
      title: 'Settings Reset',
      description: 'All settings have been reset to defaults.',
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
          <Card title="Appearance">
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

        {/* Risk Thresholds */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card title="Risk Thresholds">
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Drawdown Alert Threshold</p>
                  <span className="text-sm text-muted-foreground">
                    {drawdownThreshold[0].toFixed(1)}%
                  </span>
                </div>
                <Slider
                  min={1}
                  max={20}
                  step={0.5}
                  value={drawdownThreshold}
                  onValueChange={setDrawdownThreshold}
                />
                <p className="text-sm text-muted-foreground">
                  Alert when portfolio drawdown exceeds this percentage
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Volatility Z-Score Threshold</p>
                  <span className="text-sm text-muted-foreground">
                    {volZScore[0].toFixed(1)}σ
                  </span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={0.1}
                  value={volZScore}
                  onValueChange={setVolZScore}
                />
                <p className="text-sm text-muted-foreground">
                  Trigger alert when vol deviates by this many standard deviations
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">VaR Confidence Level (α)</p>
                  <span className="text-sm text-muted-foreground">{varAlpha[0].toFixed(1)}%</span>
                </div>
                <Slider
                  min={90}
                  max={99}
                  step={0.5}
                  value={varAlpha}
                  onValueChange={setVarAlpha}
                />
                <p className="text-sm text-muted-foreground">
                  Confidence level for Value-at-Risk calculations
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Data Sources */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card title="Data Sources">
            <div className="space-y-6">
              <div>
                <p className="font-medium mb-2">API Base URL</p>
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Backend API endpoint (no backend yet; currently using mock data)
                </p>
              </div>

              <div className="rounded-lg border border-dashed p-4 space-y-2">
                <p className="text-sm font-medium">Integration TODOs</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    <strong>Kaggle CSV:</strong> Load historical price data (schema: date, symbol,
                    open, high, low, close, volume)
                  </li>
                  <li>
                    <strong>Yahoo Finance:</strong> Real-time OHLCV via API
                  </li>
                  <li>
                    <strong>News Sentiment:</strong> NYTimes/Bloomberg → Alerts feed
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
            </div>
          </Card>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
