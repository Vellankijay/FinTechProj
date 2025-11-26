"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Donut } from "@/components/charts/Donut";
import { Heatmap } from "@/components/charts/Heatmap";
import { BarsHorizontal } from "@/components/charts/BarsHorizontal";
import { Skeleton } from "@/components/ui/skeleton";
import { useExposureSummary, useVaRDistributions, useHeatmapData } from "@/lib/data/adapters";
import { REGIONS, ASSET_CLASSES } from "@/lib/mock/seeds";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { DrilldownLevel } from "@/types";

// Import ready-to-use CompanyListModal
import CompanyList from "@/components/data-display/companyList";
import healthcareList from "@/components/data-display/healthcareList"
import HealthcareList from "@/components/data-display/healthcareList";

export default function Summary() {
  const [drilldownLevel, setDrilldownLevel] = useState<DrilldownLevel>('global');
  const [viewMode, setViewMode] = useState<'overview' | 'tech' | 'healthtech'>('overview');

  const { data: summaryData, isLoading: summaryLoading } = useExposureSummary(drilldownLevel, false);
  const { data: varData, isLoading: varLoading } = useVaRDistributions(false);
  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmapData(false);

  // Tech company list state shared between tabs
  const [techCompanies, setTechCompanies] = useState<{ ticker: string; shares: number }[]>([]);
  const [healthtechCompanies, setHealthtechCompanies] = useState<{ticker: string; shares: number}[]>([]);

  useEffect(() => {
    // Initialize company list from backend summary
    if (summaryData?.techCompanies) {
      setTechCompanies(
        summaryData.techCompanies.map((c: any) => ({
          ticker: c.ticker,
          shares: c.shares || 1,
        }))
      );
    }
  }, [summaryData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Summary</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tech & Healthtech Risk Management Dashboard
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={v => setViewMode(v as typeof viewMode)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tech">Tech</TabsTrigger>
          <TabsTrigger value="healthtech">Healthtech</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 mt-6">
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

          {/* Display Company List */}
          {/* <CompanyList
            tickers={techCompanies}
            onChange={(updated: any) => setTechCompanies(updated)}
          /> */}
        </TabsContent>

        {/* TECH TAB */}
        <TabsContent value="tech" className="space-y-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Tech Portfolio Metrics</h2>
            <div className="text-sm text-muted-foreground">
              Cloud • AI/ML • Cybersecurity • Enterprise Software
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass-panel p-4">
              <div className="text-sm text-muted-foreground">Tech Exposure</div>
              <div className="text-2xl font-bold mt-1">
                {summaryLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  formatCurrency((summaryData?.totalExposure || 0) * 0.48, 0)
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">~48% of total</div>
            </Card>
            <Card className="glass-panel p-4">
              <div className="text-sm text-muted-foreground">Avg VaR (10d)</div>
              <div className="text-2xl font-bold mt-1">
                {summaryLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  formatCurrency((summaryData?.totalExposure || 0) * 0.048, 0)
                )}
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

          {/* TECH COMPANY LIST (Optional: you could reuse CompanyListModal here too) */}
          <CompanyList
            tickers={techCompanies}
            onChange={(updated: any) => setTechCompanies(updated)}
          />
        </TabsContent>

        {/* HEALTHTECH TAB */}
        <TabsContent value="healthtech" className="space-y-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Tech Portfolio Metrics</h2>
            <div className="text-sm text-muted-foreground">
              Cloud • AI/ML • Cybersecurity • Enterprise Software
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass-panel p-4">
              <div className="text-sm text-muted-foreground">Tech Exposure</div>
              <div className="text-2xl font-bold mt-1">
                {summaryLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  formatCurrency((summaryData?.totalExposure || 0) * 0.48, 0)
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">~48% of total</div>
            </Card>
            <Card className="glass-panel p-4">
              <div className="text-sm text-muted-foreground">Avg VaR (10d)</div>
              <div className="text-2xl font-bold mt-1">
                {summaryLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  formatCurrency((summaryData?.totalExposure || 0) * 0.048, 0)
                )}
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

          {/* TECH COMPANY LIST (Optional: you could reuse CompanyListModal here too) */}
          <HealthcareList
            tickers={techCompanies}
            onChange={(updated: any) => setTechCompanies(updated)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
