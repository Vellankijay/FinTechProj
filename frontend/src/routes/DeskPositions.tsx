import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { KpiStrip } from '@/components/data-display/KpiStrip';
import { Treemap } from '@/components/charts/Treemap';
import { TimeSeries } from '@/components/charts/TimeSeries';
import { Scatter } from '@/components/charts/Scatter';
import { Legend } from '@/components/data-display/Legend';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { mockDataGenerator } from '@/lib/mock/generator';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { KpiMetric, TreemapNode } from '@/types';
import { INDUSTRY_COLORS } from '@/types';

export default function DeskPositions() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [refreshKey, setRefreshKey] = useState(0);
  const mockLiveEnabled = useSettingsStore((state) => state.mockLiveEnabled);

  // Subscribe to live updates for continuous data refreshing
  useEffect(() => {
    if (mockLiveEnabled) {
      mockDataGenerator.startLiveUpdates(true);
      const unsubscribe = mockDataGenerator.subscribe(() => {
        setRefreshKey((k) => k + 1);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [mockLiveEnabled]);

  const { data: positionsData, isLoading: positionsLoading } = useQuery({
    queryKey: ['desk-positions-data', refreshKey],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const positions = mockDataGenerator.getSymbolPositions();

      const kpis: KpiMetric[] = [
        {
          id: 'total-value',
          label: 'Total Market Value',
          value: positions.reduce((sum, p) => sum + p.marketValue, 0),
          unit: '$',
          change: 2.5,
          trend: 'up',
          status: 'normal',
        },
        {
          id: 'positions',
          label: 'Open Positions',
          value: positions.length,
          change: 0,
          trend: 'neutral',
          status: 'normal',
        },
        {
          id: 'avg-sentiment',
          label: 'Avg Sentiment',
          value: positions.reduce((sum, p) => sum + p.sentiment, 0) / positions.length,
          change: 5.2,
          trend: 'up',
          status: 'normal',
        },
        {
          id: 'volatility',
          label: 'Avg Volatility',
          value: positions.reduce((sum, p) => sum + p.highLowSpread, 0) / positions.length,
          unit: '%',
          change: -1.3,
          trend: 'down',
          status: 'normal',
        },
      ];

      const positionMapData: TreemapNode = {
        name: 'All Positions',
        value: 0,
        children: [],
      };

      const byIndustry: Record<string, TreemapNode> = {};

      positions.forEach((p) => {
        if (!byIndustry[p.industry]) {
          byIndustry[p.industry] = {
            name: p.industry,
            value: 0,
            children: [],
          };
        }
        byIndustry[p.industry].value += p.marketValue;
        byIndustry[p.industry].children!.push({
          name: p.symbol,
          value: p.marketValue,
          color: (INDUSTRY_COLORS as any)[p.industry] || '#64748b',
        });
      });

      positionMapData.children = Object.values(byIndustry);

      const sentimentScatter = positions.map((p) => ({
        id: p.symbol,
        name: p.symbol,
        x: p.sentiment * 100,
        y: p.priceChangePercent,
        size: p.marketValue,
        color: (INDUSTRY_COLORS as any)[p.industry] || '#64748b',
        category: 'sentiment',
      }));

      const spreadScatter = positions.map((p) => ({
        id: p.symbol,
        name: p.symbol,
        x: p.highLowSpread * 100,
        y: p.sentiment,
        size: p.marketValue,
        color: (INDUSTRY_COLORS as any)[p.industry] || '#64748b',
        category: 'spread',
      }));

      return { kpis, positionMapData, sentimentScatter, spreadScatter, rawPositions: positions };
    },
    staleTime: mockLiveEnabled ? 0 : 30000, // Live mode: always fresh, otherwise cache for 30s
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['symbol-history', selectedSymbol, refreshKey],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return mockDataGenerator.getPriceHistory(selectedSymbol, 50);
    },
    staleTime: mockLiveEnabled ? 0 : 30000, // Live mode: always fresh, otherwise cache for 30s
    enabled: !!selectedSymbol,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Desk Positions</h1>
        <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      {positionsLoading ? (
        <Skeleton className="w-full h-32" />
      ) : (
        <KpiStrip metrics={positionsData?.kpis || []} />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">Position Map</h2>
          <p className="text-sm text-muted-foreground mb-4">By Industry & Symbol</p>
          <div className="h-[400px]">
            {positionsLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <Treemap data={positionsData?.positionMapData || { name: 'Root', value: 0 }} />
            )}
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent History</h2>
            {!positionsLoading && positionsData?.rawPositions && (
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positionsData.rawPositions.map((p) => (
                    <SelectItem key={p.symbol} value={p.symbol}>
                      {p.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="h-[400px]">
            {historyLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <TimeSeries data={historyData || []} color="#3b82f6" />
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">Price-Sentiment Scatter</h2>
          <p className="text-sm text-muted-foreground mb-4">X = Net Sentiment, Y = Price Change %</p>
          <div className="h-[400px]">
            {positionsLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <Scatter
                data={positionsData?.sentimentScatter || []}
                xLabel="Net Sentiment"
                yLabel="Price Change %"
                showRegression={true}
              />
            )}
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">Spreads Scatter</h2>
          <p className="text-sm text-muted-foreground mb-4">X = High-Low Spread %, Y = Sentiment</p>
          <div className="h-[400px]">
            {positionsLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <Scatter
                data={positionsData?.spreadScatter || []}
                xLabel="Spread %"
                yLabel="Sentiment"
                showRegression={false}
              />
            )}
          </div>
        </Card>
      </div>

      <Legend />
    </div>
  );
}
