import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Donut } from '@/components/charts/Donut';
import { BarsHorizontal } from '@/components/charts/BarsHorizontal';
import { KpiStrip } from '@/components/data-display/KpiStrip';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { mockDataGenerator } from '@/lib/mock/generator';
import { useSettingsStore } from '@/store/useSettingsStore';
import { formatCurrency } from '@/lib/utils';
import { calculateTechRiskScore } from '@/lib/riskCalculator';
import { AlertCircle } from 'lucide-react';
import type { KpiMetric } from '@/types';

// Tech-specific desks
const TECH_DESKS = [
  'Cloud Computing',
  'AI & Machine Learning',
  'Cybersecurity',
  'Enterprise Software',
];

export default function Tech() {
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

  const { data, isLoading } = useQuery({
    queryKey: ['tech-page-data', refreshKey],
    queryFn: async () => {
      const allData = mockDataGenerator.getExposureData();

      // Filter for tech desks only
      const rawData = allData.filter((d) => TECH_DESKS.includes(d.desk || ''));

      // Calculate total metrics
      const totalExposure = rawData.reduce((sum, d) => sum + d.exposure, 0);
      const totalLimit = rawData.reduce((sum, d) => sum + d.exposureLimit, 0);
      const avgPnL = rawData.length > 0 ? rawData.reduce((sum, d) => sum + d.dailyPnl, 0) / rawData.length : 0;
      const totalVaR = rawData.reduce((sum, d) => sum + d.var10day, 0);

      // KPI metrics
      const kpis: KpiMetric[] = [
        {
          id: 'total-exposure',
          label: 'Total Tech Investment',
          value: totalExposure,
          unit: '$',
          change: 2.5,
          trend: 'up',
          status: 'normal',
        },
        {
          id: 'utilization',
          label: 'Portfolio Utilization',
          value: totalLimit > 0 ? (totalExposure / totalLimit) * 100 : 0,
          unit: '%',
          change: 1.2,
          trend: 'up',
          status: totalLimit > 0 && totalExposure / totalLimit > 0.8 ? 'warning' : 'normal',
        },
        {
          id: 'avg-pnl',
          label: 'Average Daily P&L',
          value: avgPnL,
          unit: '$',
          change: 5.3,
          trend: avgPnL > 0 ? 'up' : 'down',
          status: avgPnL > 0 ? 'normal' : 'warning',
        },
        {
          id: 'var',
          label: 'Total Risk (10-day VaR)',
          value: totalVaR,
          unit: '$',
          change: -1.5,
          trend: 'down',
          status: 'normal',
        },
      ];

      // Investment breakdown by tech desk
      const byDesk: Record<string, number> = {};
      rawData.forEach((d) => {
        const desk = d.desk || 'Unknown';
        byDesk[desk] = (byDesk[desk] || 0) + d.exposure;
      });

      const donutData = Object.entries(byDesk).map(([name, value]) => ({
        name,
        value,
        percentage: totalExposure > 0 ? (value / totalExposure) * 100 : 0,
        color:
          name === 'Cloud Computing'
            ? '#3b82f6'
            : name === 'AI & Machine Learning'
            ? '#8b5cf6'
            : name === 'Cybersecurity'
            ? '#ef4444'
            : '#06b6d4',
      }));

      // Investment type breakdown
      const byAssetClass: Record<string, number> = {};
      rawData.forEach((d) => {
        byAssetClass[d.assetClass] = (byAssetClass[d.assetClass] || 0) + d.exposure;
      });

      const assetClassData = Object.entries(byAssetClass)
        .map(([name, value]) => ({
          bucket: name,
          count: value,
          percentage: totalExposure > 0 ? (value / totalExposure) * 100 : 0,
          color: '#3b82f6',
        }))
        .sort((a, b) => b.count - a.count);

      // Regional breakdown
      const byRegion: Record<string, number> = {};
      rawData.forEach((d) => {
        byRegion[d.region] = (byRegion[d.region] || 0) + d.exposure;
      });

      const regionData = Object.entries(byRegion)
        .map(([name, value]) => ({
          bucket: name,
          count: value,
          percentage: totalExposure > 0 ? (value / totalExposure) * 100 : 0,
          color: '#22c55e',
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate Risk Score
      const riskScore = calculateTechRiskScore({
        totalExposure,
        totalLimit,
        totalVaR,
        avgPnL,
        numPositions: rawData.length,
        sectorDiversification: Object.keys(byDesk).length,
      });

      return { kpis, donutData, assetClassData, regionData, totalExposure, rawData, riskScore };
    },
    staleTime: mockLiveEnabled ? 0 : 30000,
    refetchInterval: mockLiveEnabled ? 800 : false,
    placeholderData: (previousData) => previousData,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tech Portfolio Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your investments in Cloud, AI/ML, Cybersecurity, and Enterprise Software
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {data?.rawData?.length || 0} tech investments
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <Skeleton className="w-full h-32" />
      ) : (
        <KpiStrip metrics={data?.kpis || []} />
      )}

      {/* Risk Score Card */}
      {!isLoading && data?.riskScore && (
        <Card className="glass-panel p-6 border-2" style={{ borderColor: data.riskScore.color }}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
                  style={{ backgroundColor: `${data.riskScore.color}20`, color: data.riskScore.color }}
                >
                  {data.riskScore.score}
                </div>
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: data.riskScore.color }}>
                    {data.riskScore.rating}
                  </h3>
                  <p className="text-sm text-muted-foreground">Portfolio Risk Assessment</p>
                </div>
              </div>
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>

            {/* Recommendation */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm leading-relaxed">{data.riskScore.recommendation}</p>
            </div>

            {/* Risk Factors Breakdown */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                How We Calculated This Score
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Diversification */}
                <div className="p-4 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Diversification</span>
                    <span className="text-sm font-bold">{data.riskScore.factors.diversification.score}/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: `${data.riskScore.factors.diversification.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{data.riskScore.factors.diversification.explanation}</p>
                  <p className="text-xs text-muted-foreground mt-1 opacity-70">Weight: {data.riskScore.factors.diversification.weight}%</p>
                </div>

                {/* Volatility */}
                <div className="p-4 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Volatility Control</span>
                    <span className="text-sm font-bold">{data.riskScore.factors.volatility.score}/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${data.riskScore.factors.volatility.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{data.riskScore.factors.volatility.explanation}</p>
                  <p className="text-xs text-muted-foreground mt-1 opacity-70">Weight: {data.riskScore.factors.volatility.weight}%</p>
                </div>

                {/* Exposure */}
                <div className="p-4 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Exposure Management</span>
                    <span className="text-sm font-bold">{data.riskScore.factors.exposure.score}/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${data.riskScore.factors.exposure.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{data.riskScore.factors.exposure.explanation}</p>
                  <p className="text-xs text-muted-foreground mt-1 opacity-70">Weight: {data.riskScore.factors.exposure.weight}%</p>
                </div>

                {/* Performance */}
                <div className="p-4 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Performance</span>
                    <span className="text-sm font-bold">{data.riskScore.factors.performance.score}/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-yellow-500 transition-all duration-500"
                      style={{ width: `${data.riskScore.factors.performance.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{data.riskScore.factors.performance.explanation}</p>
                  <p className="text-xs text-muted-foreground mt-1 opacity-70">Weight: {data.riskScore.factors.performance.weight}%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Where is your money invested? */}
        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-2">Where Is Your Money Invested?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Breakdown of your tech investments by sector
          </p>
          <div className="h-[400px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <Donut
                data={data?.donutData || []}
                centerLabel="Total"
                centerValue={formatCurrency(data?.totalExposure || 0, 0)}
              />
            )}
          </div>
        </Card>

        {/* Investment Types */}
        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-2">Investment Types</h2>
          <p className="text-sm text-muted-foreground mb-4">
            How your tech portfolio is structured (Public Equity, VC, etc.)
          </p>
          <div className="h-[400px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <BarsHorizontal data={data?.assetClassData || []} />
            )}
          </div>
        </Card>
      </div>

      {/* Regional Distribution */}
      <Card className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-2">Where Are You Investing?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Geographic distribution of your tech investments
        </p>
        <div className="h-[300px]">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <BarsHorizontal data={data?.regionData || []} />
          )}
        </div>
      </Card>
    </div>
  );
}
