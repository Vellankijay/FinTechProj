import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { KpiStrip } from '@/components/data-display/KpiStrip';
import { Donut } from '@/components/charts/Donut';
import { BarsHorizontal } from '@/components/charts/BarsHorizontal';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { mockDataGenerator } from '@/lib/mock/generator';
import { useSettingsStore } from '@/store/useSettingsStore';
import { formatCurrency } from '@/lib/utils';
import { calculateHealthtechRiskScore } from '@/lib/riskCalculator';
import { AlertCircle } from 'lucide-react';
import type { KpiMetric } from '@/types';
import { INDUSTRY_COLORS } from '@/types';

// Healthtech-specific industries
const HEALTHTECH_INDUSTRIES = [
  'Medical Technology',
  'Biotechnology',
  'Digital Health',
  'Healthcare IT',
  'Pharma Tech',
  'Telemedicine',
];

export default function Healthtech() {
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
    queryKey: ['healthtech-positions-data', refreshKey],
    queryFn: async () => {
      const allPositions = mockDataGenerator.getSymbolPositions();

      // Filter for healthtech industries only
      const positions = allPositions.filter((p) => HEALTHTECH_INDUSTRIES.includes(p.industry));

      // Calculate totals
      const totalMarketValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
      const avgPriceChange = positions.reduce((sum, p) => sum + p.priceChangePercent, 0) / (positions.length || 1);
      const avgVolatility = positions.reduce((sum, p) => sum + p.highLowSpread, 0) / (positions.length || 1);

      const kpis: KpiMetric[] = [
        {
          id: 'total-value',
          label: 'Total Healthtech Investment',
          value: totalMarketValue,
          unit: '$',
          change: 3.2,
          trend: 'up',
          status: 'normal',
        },
        {
          id: 'positions',
          label: 'Number of Companies',
          value: positions.length,
          change: 0,
          trend: 'neutral',
          status: 'normal',
        },
        {
          id: 'avg-performance',
          label: 'Average Price Change',
          value: avgPriceChange,
          unit: '%',
          change: 4.8,
          trend: avgPriceChange > 0 ? 'up' : 'down',
          status: avgPriceChange > 0 ? 'normal' : 'warning',
        },
        {
          id: 'volatility',
          label: 'Average Volatility',
          value: avgVolatility * 100,
          unit: '%',
          change: -1.2,
          trend: 'down',
          status: 'normal',
        },
      ];

      // Industry breakdown
      const byIndustry: Record<string, number> = {};
      positions.forEach((p) => {
        byIndustry[p.industry] = (byIndustry[p.industry] || 0) + p.marketValue;
      });

      const donutData = Object.entries(byIndustry).map(([name, value]) => ({
        name,
        value,
        percentage: totalMarketValue > 0 ? (value / totalMarketValue) * 100 : 0,
        color: (INDUSTRY_COLORS as any)[name] || '#22c55e',
      }));

      // Top companies by market value
      const topCompanies = [...positions]
        .sort((a, b) => b.marketValue - a.marketValue)
        .slice(0, 10)
        .map((p) => ({
          bucket: p.symbol,
          count: p.marketValue,
          percentage: totalMarketValue > 0 ? (p.marketValue / totalMarketValue) * 100 : 0,
          color: '#22c55e',
        }));

      // Performance distribution
      const performanceRanges = [
        { label: 'Strong Growth (>5%)', min: 5, max: Infinity },
        { label: 'Growth (0-5%)', min: 0, max: 5 },
        { label: 'Decline (0 to -5%)', min: -5, max: 0 },
        { label: 'Strong Decline (<-5%)', min: -Infinity, max: -5 },
      ];

      const performanceData = performanceRanges.map(({ label, min, max }) => {
        const count = positions.filter((p) => p.priceChangePercent > min && p.priceChangePercent <= max).length;
        return {
          bucket: label,
          count,
          percentage: (count / (positions.length || 1)) * 100,
          color: min > 0 ? '#22c55e' : max < 0 ? '#ef4444' : '#eab308',
        };
      });

      // Count positive vs negative performers
      const positivePerformers = positions.filter((p) => p.priceChangePercent > 0).length;
      const negativePerformers = positions.filter((p) => p.priceChangePercent <= 0).length;

      // Calculate Risk Score
      const riskScore = calculateHealthtechRiskScore({
        totalMarketValue,
        avgPriceChange,
        avgVolatility,
        numCompanies: positions.length,
        industryDiversification: Object.keys(byIndustry).length,
        performanceDistribution: { positive: positivePerformers, negative: negativePerformers },
      });

      return { kpis, donutData, topCompanies, performanceData, totalMarketValue, riskScore };
    },
    staleTime: mockLiveEnabled ? 0 : 30000,
    refetchInterval: mockLiveEnabled ? 800 : false,
    placeholderData: (previousData) => previousData,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Healthtech Portfolio Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your investments in Medical Devices, Biotech, Digital Health, and Healthcare IT
          </p>
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
                  <p className="text-sm text-muted-foreground">Healthtech Portfolio Risk Assessment</p>
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
                    <span className="text-sm font-medium">Industry Diversification</span>
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
                    <span className="text-sm font-medium">Price Volatility</span>
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

                {/* Performance */}
                <div className="p-4 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Price Performance</span>
                    <span className="text-sm font-bold">{data.riskScore.factors.performance.score}/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${data.riskScore.factors.performance.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{data.riskScore.factors.performance.explanation}</p>
                  <p className="text-xs text-muted-foreground mt-1 opacity-70">Weight: {data.riskScore.factors.performance.weight}%</p>
                </div>

                {/* Exposure Distribution */}
                <div className="p-4 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Winning vs Losing Positions</span>
                    <span className="text-sm font-bold">{data.riskScore.factors.exposure.score}/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-yellow-500 transition-all duration-500"
                      style={{ width: `${data.riskScore.factors.exposure.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{data.riskScore.factors.exposure.explanation}</p>
                  <p className="text-xs text-muted-foreground mt-1 opacity-70">Weight: {data.riskScore.factors.exposure.weight}%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Industry Breakdown */}
        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-2">Where Is Your Money Invested?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Breakdown of your healthtech investments by industry
          </p>
          <div className="h-[400px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <Donut
                data={data?.donutData || []}
                centerLabel="Total"
                centerValue={formatCurrency(data?.totalMarketValue || 0, 0)}
              />
            )}
          </div>
        </Card>

        {/* Top Holdings */}
        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-2">Top 10 Holdings</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your largest healthtech company investments by market value
          </p>
          <div className="h-[400px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <BarsHorizontal data={data?.topCompanies || []} />
            )}
          </div>
        </Card>
      </div>

      {/* Performance Distribution */}
      <Card className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-2">How Are Your Companies Performing?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Number of companies in each performance category
        </p>
        <div className="h-[300px]">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <BarsHorizontal data={data?.performanceData || []} />
          )}
        </div>
      </Card>
    </div>
  );
}
