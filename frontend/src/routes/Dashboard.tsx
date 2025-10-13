import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Clock, Settings, Newspaper } from 'lucide-react';
import { fetchVaRTimeline, fetchPositions, fetchAlerts, fetchExposure } from '@/lib/data/adapters';
import { openVaRStream } from '@/lib/sockets';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Card from '@/components/Card';
import Stat from '@/components/Stat';
import BreachBanner from '@/components/BreachBanner';
import LimitBadge from '@/components/LimitBadge';
import AlertItem from '@/components/AlertItem';
import Heatmap from '@/components/Heatmap';
import EmptyState from '@/components/EmptyState';
import type { Alert } from '@/lib/mock/seeds';

export default function Dashboard() {
  const [liveVaR, setLiveVaR] = useState(52000);
  const [breaches, setBreaches] = useState<{ type: string; value: number; limit: number }[]>([]);
  const [showBreach, setShowBreach] = useState(true);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [shockPercent, setShockPercent] = useState([0]);
  const [volMultiplier, setVolMultiplier] = useState([1]);

  // Fetch data with TanStack Query
  const { data: varData = [] } = useQuery({
    queryKey: ['var-timeline'],
    queryFn: fetchVaRTimeline,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: fetchPositions,
    refetchInterval: 5000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  });

  const { data: exposure = [] } = useQuery({
    queryKey: ['exposure'],
    queryFn: fetchExposure,
  });

  // Live VaR stream
  useEffect(() => {
    const subscription = openVaRStream(52000).subscribe((newVaR) => {
      setLiveVaR(newVaR);
      if (newVaR > 75000) {
        setBreaches([{ type: 'VaR', value: newVaR, limit: 75000 }]);
        setShowBreach(true);
      } else {
        setBreaches([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Compute stats
  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalExposure = positions.reduce((sum, p) => sum + p.exposure, 0);

  // Generate P&L data (mock intraday)
  const pnlData = varData.map((v, i) => ({
    timestamp: v.timestamp,
    pnl: totalPnL * (0.5 + (i / varData.length) * 0.5) + (Math.random() - 0.5) * 5000,
  }));

  // Filter alerts by severity
  const infoAlerts = alerts.filter((a) => a.severity === 'INFO');
  const warnAlerts = alerts.filter((a) => a.severity === 'WARN');
  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');

  const handleApplyScenario = () => {
    // Mock scenario application
    const shock = shockPercent[0] / 100;
    const vol = volMultiplier[0];
    const newVaR = liveVaR * (1 + shock) * vol;
    setLiveVaR(newVaR);
    setScenarioOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Breach Banner */}
      {showBreach && <BreachBanner breaches={breaches} onDismiss={() => setShowBreach(false)} />}

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Risk Dashboard</h1>
            <p className="text-muted-foreground mt-1">Live intraday monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Connected" />
          </div>
        </div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card title="Current VaR">
            <Stat
              label="Value at Risk (95%)"
              value={formatCurrency(liveVaR, 0)}
              change={((liveVaR - 50000) / 50000) * 100}
            />
            <div className="mt-3">
              <LimitBadge value={liveVaR} limit={75000} />
            </div>
          </Card>

          <Card title="P&L Today">
            <Stat
              label="Profit & Loss"
              value={formatCurrency(totalPnL, 0)}
              change={(totalPnL / totalExposure) * 100}
            />
          </Card>

          <Card title="Total Exposure">
            <Stat label="Notional Exposure" value={formatCurrency(totalExposure, 0)} />
          </Card>

          <Card title="Active Positions">
            <Stat label="Number of Positions" value={positions.length} />
          </Card>
        </motion.div>

        {/* VaR Timeline */}
        <Card
          title="VaR Timeline"
          action={
            <Sheet open={scenarioOpen} onOpenChange={setScenarioOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  What-If Scenario
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Scenario Analysis</SheetTitle>
                  <SheetDescription>
                    Adjust parameters to preview VaR and P&L deltas before applying.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Market Shock: {shockPercent[0]}%
                    </label>
                    <Slider
                      min={-20}
                      max={20}
                      step={1}
                      value={shockPercent}
                      onValueChange={setShockPercent}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Vol Multiplier: {volMultiplier[0].toFixed(1)}x
                    </label>
                    <Slider
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={volMultiplier}
                      onValueChange={setVolMultiplier}
                    />
                  </div>
                  <div className="rounded-lg border p-4 space-y-2">
                    <p className="text-sm font-medium">Preview</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        New VaR:{' '}
                        {formatCurrency(
                          liveVaR * (1 + shockPercent[0] / 100) * volMultiplier[0],
                          0
                        )}
                      </p>
                      <p>
                        P&L Delta:{' '}
                        {formatCurrency(totalPnL * (shockPercent[0] / 100), 0)}
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleApplyScenario} className="w-full">
                    Apply Scenario (Mock)
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={varData}>
              <defs>
                <linearGradient id="varGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { timeStyle: 'short' })}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <p className="font-semibold">VaR: {formatCurrency(payload[0].value as number, 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payload[0].payload.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ) : null
                }
              />
              <ReferenceLine y={75000} stroke="#ef4444" strokeDasharray="3 3" label="Limit" />
              <Area
                type="monotone"
                dataKey="var"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#varGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* P&L Intraday + Exposure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="P&L Intraday">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={pnlData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { timeStyle: 'short' })}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="rounded-lg border bg-background p-3 shadow-lg">
                        <p className="font-semibold">P&L: {formatCurrency(payload[0].value as number, 0)}</p>
                      </div>
                    ) : null
                  }
                />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Exposure by Asset Class">
            <Heatmap data={exposure} />
          </Card>
        </div>

        {/* Positions Table */}
        <Card title="Positions Blotter">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Avg Px</TableHead>
                  <TableHead>Current Px</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Exposure</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Desk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((pos) => (
                  <TableRow key={pos.symbol}>
                    <TableCell className="font-mono font-medium">{pos.symbol}</TableCell>
                    <TableCell>{pos.side}</TableCell>
                    <TableCell>{formatNumber(pos.quantity)}</TableCell>
                    <TableCell>{formatCurrency(pos.avgPrice)}</TableCell>
                    <TableCell>{formatCurrency(pos.currentPrice)}</TableCell>
                    <TableCell
                      className={pos.pnl >= 0 ? 'text-green-500' : 'text-red-500'}
                    >
                      {formatCurrency(pos.pnl, 0)}
                    </TableCell>
                    <TableCell>{formatCurrency(pos.exposure, 0)}</TableCell>
                    <TableCell>{pos.riskClass}</TableCell>
                    <TableCell>{pos.desk}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Alerts Feed + News */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Alerts Feed" className="lg:col-span-2">
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All ({alerts.length})</TabsTrigger>
                <TabsTrigger value="critical">Critical ({criticalAlerts.length})</TabsTrigger>
                <TabsTrigger value="warn">Warn ({warnAlerts.length})</TabsTrigger>
                <TabsTrigger value="info">Info ({infoAlerts.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-2 max-h-96 overflow-y-auto">
                {alerts.map((alert: Alert) => (
                  <AlertItem key={alert.id} {...alert} />
                ))}
              </TabsContent>
              <TabsContent value="critical" className="space-y-2 max-h-96 overflow-y-auto">
                {criticalAlerts.map((alert: Alert) => (
                  <AlertItem key={alert.id} {...alert} />
                ))}
              </TabsContent>
              <TabsContent value="warn" className="space-y-2 max-h-96 overflow-y-auto">
                {warnAlerts.map((alert: Alert) => (
                  <AlertItem key={alert.id} {...alert} />
                ))}
              </TabsContent>
              <TabsContent value="info" className="space-y-2 max-h-96 overflow-y-auto">
                {infoAlerts.map((alert: Alert) => (
                  <AlertItem key={alert.id} {...alert} />
                ))}
              </TabsContent>
            </Tabs>
          </Card>

          <Card title="News & Sentiment">
            <EmptyState
              icon={Newspaper}
              title="News Coming Soon"
              description="TODO: Integrate NYTimes or Bloomberg sentiment analysis here. Will slot into alerts feed."
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
