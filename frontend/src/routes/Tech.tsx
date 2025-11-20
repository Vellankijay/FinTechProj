import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { KpiStrip } from '@/components/data-display/KpiStrip';
import { Donut } from '@/components/charts/Donut';
import { BarsHorizontal } from '@/components/charts/BarsHorizontal';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export default function Tech() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tech-portfolio'],
    queryFn: async () => {
      console.log('🔍 Fetching tech data...');
      
      // Try the full backend URL
      const url = 'http://localhost:8000/api/tech/portfolio';
      console.log('Fetching from:', url);
      
      const response = await fetch(url);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tech data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Data received:', data);
      console.log('KPIs:', data.kpis);
      console.log('Total Market Value:', data.totalMarketValue);
      console.log('Donut Data:', data.donutData);
      console.log('Top Companies:', data.topCompanies);
      
      return data;
    },
    staleTime: 30000,
    retry: 1,
  });

  // Log whenever data changes
  useEffect(() => {
    console.log('Data state updated:', data);
  }, [data]);

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6 border-red-500">
          <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Data</h2>
          <p className="text-sm mb-4">{error.message}</p>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
          <div className="mt-4">
            <p className="text-sm font-semibold">Troubleshooting:</p>
            <ul className="text-xs list-disc list-inside mt-2 space-y-1">
              <li>Check if backend is running on http://localhost:8000</li>
              <li>Visit http://localhost:8000/api/tech/portfolio in your browser</li>
              <li>Check browser console for CORS errors</li>
              <li>Verify backend CORS settings allow your frontend origin</li>
            </ul>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tech Portfolio Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your investments in Consumer Tech, Cloud & Enterprise, Semiconductors
          </p>
        </div>
      </div>

      {/* Debug Info - Remove this after fixing */}
      

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
                  <p className="text-sm text-muted-foreground">Tech Portfolio Risk Assessment</p>
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
            Breakdown of your Tech investments by industry
          </p>
          <div className="h-[400px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : data?.donutData && data.donutData.length > 0 ? (
              <Donut
                data={data.donutData}
                centerLabel="Total"
                centerValue={formatCurrency(data.totalMarketValue || 0, 0)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No industry data available
              </div>
            )}
          </div>
        </Card>

        {/* Top Holdings */}
        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-2">Top 10 Holdings</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your largest tech company investments by market value
          </p>
          <div className="h-[400px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : data?.topCompanies && data.topCompanies.length > 0 ? (
              <BarsHorizontal data={data.topCompanies} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No company data available
              </div>
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
          ) : data?.performanceData && data.performanceData.length > 0 ? (
            <BarsHorizontal data={data.performanceData} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No performance data available
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
