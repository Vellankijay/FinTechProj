import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Donut } from '@/components/charts/Donut';
import { Heatmap } from '@/components/charts/Heatmap';
import { BarsHorizontal } from '@/components/charts/BarsHorizontal';
import { Skeleton } from '@/components/ui/skeleton';
import { useExposureSummary, useVaRDistributions, useHeatmapData } from '@/lib/data/adapters';
import { REGIONS, ASSET_CLASSES } from '@/lib/mock/seeds';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { DrilldownLevel } from '@/types';

export default function Summary() {
  const [drilldownLevel, setDrilldownLevel] = useState<DrilldownLevel>('global');
  const [viewMode, setViewMode] = useState<'overview' | 'tech' | 'healthtech'>('overview');
  // Summary page uses snapshot mode - data only updates when page is refreshed
  const { data: summaryData, isLoading: summaryLoading } = useExposureSummary(drilldownLevel, false);
  const { data: varData, isLoading: varLoading } = useVaRDistributions(false);
  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmapData(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Summary</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tech & Healthtech Risk Management Dashboard
          </p>
        </div>
        <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tech">Tech</TabsTrigger>
          <TabsTrigger value="healthtech">Healthtech</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Combined Portfolio Overview</h2>
          </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="glass-panel p-4">
          <div className="text-sm text-muted-foreground">Total Exposure</div>
          <div className="text-2xl font-bold mt-1">
            {summaryLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(summaryData?.totalExposure || 0, 0)}
          </div>
        </Card>
        <Card className="glass-panel p-4">
          <div className="text-sm text-muted-foreground">Total Limit</div>
          <div className="text-2xl font-bold mt-1">
            {summaryLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(summaryData?.totalLimit || 0, 0)}
          </div>
        </Card>
        <Card className="glass-panel p-4">
          <div className="text-sm text-muted-foreground">Avg Relative to Limit</div>
          <div className="text-2xl font-bold mt-1">
            {summaryLoading ? <Skeleton className="h-8 w-32" /> : formatPercent(summaryData?.avgRelToLimit || 0)}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-panel p-6">
          <Tabs value={drilldownLevel} onValueChange={(v) => setDrilldownLevel(v as DrilldownLevel)}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Exposure by Region</h2>
              <TabsList>
                <TabsTrigger value="global">Global</TabsTrigger>
                <TabsTrigger value="region">Region</TabsTrigger>
                <TabsTrigger value="country">Country</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value={drilldownLevel} className="h-[400px]">
              {summaryLoading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <Donut
                  data={summaryData?.donutData || []}
                  centerLabel="Total"
                  centerValue={formatCurrency(summaryData?.totalExposure || 0, 0)}
                />
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">Exposure Heatmap</h2>
          <div className="w-full overflow-auto">
            {heatmapLoading ? (
              <Skeleton className="w-full h-[400px]" />
            ) : (
              <Heatmap
                data={heatmapData || []}
                rows={REGIONS}
                columns={ASSET_CLASSES}
              />
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">VaR 1-Day Distribution</h2>
          <div className="h-[300px]">
            {varLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <BarsHorizontal data={varData?.var1dayDist || []} />
            )}
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">VaR 10-Day Distribution</h2>
          <div className="h-[300px]">
            {varLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <BarsHorizontal data={varData?.var10dayDist || []} />
            )}
          </div>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="tech" className="space-y-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Tech Portfolio Metrics</h2>
            <div className="text-sm text-muted-foreground">
              Cloud • AI/ML • Cybersecurity • Enterprise Software
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass-panel p-4">
              <div className="text-sm text-muted-foreground">Tech Exposure</div>
              <div className="text-2xl font-bold mt-1">
                {summaryLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency((summaryData?.totalExposure || 0) * 0.48, 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">~48% of total</div>
            </Card>
            <Card className="glass-panel p-4">
              <div className="text-sm text-muted-foreground">Avg VaR (10d)</div>
              <div className="text-2xl font-bold mt-1">
                {summaryLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency((summaryData?.totalExposure || 0) * 0.048, 0)}
              </div>
              <div className="text-xs text-green-500 mt-1">-2.3% from last period</div>
            </Card>
            <Card className="glass-panel p-4">
              <div className="text-sm text-muted-foreground">Risk Score</div>
              <div className="text-2xl font-bold mt-1">
                {summaryLoading ? <Skeleton className="h-8 w-32" /> : '72/100'}
              </div>
              <div className="text-xs text-yellow-500 mt-1">Moderate Risk</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="healthtech" className="space-y-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Healthtech Portfolio Metrics</h2>
            <div className="text-sm text-muted-foreground">
              Medical Devices • Biotech • Digital Health • Healthcare IT
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass-panel p-4">
              <div className="text-sm text-muted-foreground">Healthtech Exposure</div>
              <div className="text-2xl font-bold mt-1">
                {summaryLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency((summaryData?.totalExposure || 0) * 0.52, 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">~52% of total</div>
            </Card>
            <Card className="glass-panel p-4">
              <div className="text-sm text-muted-foreground">Avg VaR (10d)</div>
              <div className="text-2xl font-bold mt-1">
                {summaryLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency((summaryData?.totalExposure || 0) * 0.045, 0)}
              </div>
              <div className="text-xs text-green-500 mt-1">-1.8% from last period</div>
            </Card>
            <Card className="glass-panel p-4">
              <div className="text-sm text-muted-foreground">Risk Score</div>
              <div className="text-2xl font-bold mt-1">
                {summaryLoading ? <Skeleton className="h-8 w-32" /> : '68/100'}
              </div>
              <div className="text-xs text-green-500 mt-1">Low-Moderate Risk</div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
