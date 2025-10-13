import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { mockDataGenerator } from '../mock/generator';
import type {
  ExposureData,
  HeatmapCell,
  TreemapNode,
  ScatterPoint,
  VaRDistribution,
  RegionTableRow,
  KpiMetric,
  Region,
  AssetClass,
  SentimentScatterPoint,
  SpreadScatterPoint,
  FilterState,
} from '@/types';
import { INDUSTRY_COLORS } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';

export function useExposureSummary(drilldownLevel: 'global' | 'region' | 'country' = 'global', enableLiveUpdates = false) {
  const [refreshKey, setRefreshKey] = useState(0);
  const mockLiveEnabled = useSettingsStore((state) => state.mockLiveEnabled);

  useEffect(() => {
    if (mockLiveEnabled && enableLiveUpdates) {
      mockDataGenerator.startLiveUpdates(true);
      const unsubscribe = mockDataGenerator.subscribe(() => {
        setRefreshKey((k) => k + 1);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [mockLiveEnabled, enableLiveUpdates]);

  return useQuery({
    queryKey: ['exposure-summary', drilldownLevel, enableLiveUpdates ? refreshKey : 'snapshot'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const data = mockDataGenerator.getExposureData();

      const totalExposure = data.reduce((sum, d) => sum + d.exposure, 0);
      const totalLimit = data.reduce((sum, d) => sum + d.exposureLimit, 0);
      const avgRelToLimit = totalExposure / totalLimit;

      // Determine grouping key based on drilldown level
      let donutData: Array<{ name: string; value: number; percentage: number }>;

      if (drilldownLevel === 'global') {
        // Global: Show by region
        const byRegion = data.reduce((acc, d) => {
          const key = d.region;
          if (!acc[key]) acc[key] = { exposure: 0, count: 0 };
          acc[key].exposure += d.exposure;
          acc[key].count++;
          return acc;
        }, {} as Record<string, { exposure: number; count: number }>);

        donutData = Object.entries(byRegion).map(([name, { exposure }]) => ({
          name,
          value: exposure,
          percentage: (exposure / totalExposure) * 100,
        }));
      } else if (drilldownLevel === 'region') {
        // Region: Show by asset class
        const byAssetClass = data.reduce((acc, d) => {
          const key = d.assetClass;
          if (!acc[key]) acc[key] = { exposure: 0, count: 0 };
          acc[key].exposure += d.exposure;
          acc[key].count++;
          return acc;
        }, {} as Record<string, { exposure: number; count: number }>);

        donutData = Object.entries(byAssetClass).map(([name, { exposure }]) => ({
          name,
          value: exposure,
          percentage: (exposure / totalExposure) * 100,
        }));
      } else {
        // drilldownLevel === 'country' - Show by country
        const byCountry = data.reduce((acc, d) => {
          const key = d.country || 'Unknown';
          if (!acc[key]) acc[key] = { exposure: 0, count: 0 };
          acc[key].exposure += d.exposure;
          acc[key].count++;
          return acc;
        }, {} as Record<string, { exposure: number; count: number }>);

        donutData = Object.entries(byCountry).map(([name, { exposure }]) => ({
          name,
          value: exposure,
          percentage: (exposure / totalExposure) * 100,
        }));
      }

      return {
        totalExposure,
        totalLimit,
        avgRelToLimit,
        donutData,
        rawData: data,
      };
    },
    staleTime: enableLiveUpdates ? (mockLiveEnabled ? 0 : 30000) : Infinity,
  });
}

export function useVaRDistributions(enableLiveUpdates = false) {
  const [refreshKey, setRefreshKey] = useState(0);
  const mockLiveEnabled = useSettingsStore((state) => state.mockLiveEnabled);

  useEffect(() => {
    if (mockLiveEnabled && enableLiveUpdates) {
      mockDataGenerator.startLiveUpdates(true);
      const unsubscribe = mockDataGenerator.subscribe(() => {
        setRefreshKey((k) => k + 1);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [mockLiveEnabled, enableLiveUpdates]);

  return useQuery({
    queryKey: ['var-distributions', enableLiveUpdates ? refreshKey : 'snapshot'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const data = mockDataGenerator.getExposureData();

      const buckets = ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%', '100%+'];
      const var1dayDist: VaRDistribution[] = [];
      const var10dayDist: VaRDistribution[] = [];

      const var1dayCounts = [0, 0, 0, 0, 0, 0];
      const var10dayCounts = [0, 0, 0, 0, 0, 0];

      data.forEach((d) => {
        const var1dayRel = (d.var1day / d.var1dayLimit) * 100;
        const var10dayRel = d.var10dayRelToLimit * 100;

        const idx1 = Math.min(5, Math.floor(var1dayRel / 20));
        const idx10 = Math.min(5, Math.floor(var10dayRel / 20));

        var1dayCounts[idx1]++;
        var10dayCounts[idx10]++;
      });

      const colors = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#dc2626'];

      buckets.forEach((bucket, idx) => {
        var1dayDist.push({
          bucket,
          count: var1dayCounts[idx],
          percentage: (var1dayCounts[idx] / data.length) * 100,
          color: colors[idx],
        });
        var10dayDist.push({
          bucket,
          count: var10dayCounts[idx],
          percentage: (var10dayCounts[idx] / data.length) * 100,
          color: colors[idx],
        });
      });

      return { var1dayDist, var10dayDist };
    },
    staleTime: enableLiveUpdates ? (mockLiveEnabled ? 0 : 30000) : Infinity,
  });
}

export function useHeatmapData(enableLiveUpdates = false) {
  const [refreshKey, setRefreshKey] = useState(0);
  const mockLiveEnabled = useSettingsStore((state) => state.mockLiveEnabled);

  useEffect(() => {
    if (mockLiveEnabled && enableLiveUpdates) {
      mockDataGenerator.startLiveUpdates(true);
      const unsubscribe = mockDataGenerator.subscribe(() => {
        setRefreshKey((k) => k + 1);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [mockLiveEnabled, enableLiveUpdates]);

  return useQuery({
    queryKey: ['heatmap-data', enableLiveUpdates ? refreshKey : 'snapshot'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const data = mockDataGenerator.getExposureData();

      const cells: HeatmapCell[] = [];
      const groups: Record<string, { exposure: number; exposureLimit: number; count: number }> = {};

      data.forEach((d) => {
        const key = `${d.region}-${d.assetClass}`;
        if (!groups[key]) {
          groups[key] = { exposure: 0, exposureLimit: 0, count: 0 };
        }
        groups[key].exposure += d.exposure;
        groups[key].exposureLimit += d.exposureLimit;
        groups[key].count++;
      });

      Object.entries(groups).forEach(([key, { exposure, exposureLimit, count }]) => {
        const [region, assetClass] = key.split('-');
        cells.push({
          region: region as Region,
          assetClass: assetClass as AssetClass,
          value: exposure,
          exposureRelToLimit: exposure / exposureLimit,
          count,
        });
      });

      return cells;
    },
    staleTime: enableLiveUpdates ? (mockLiveEnabled ? 0 : 30000) : Infinity,
  });
}

export function useVisualExposure(filters: FilterState) {
  const [refreshKey, setRefreshKey] = useState(0);
  const mockLiveEnabled = useSettingsStore((state) => state.mockLiveEnabled);

  useEffect(() => {
    if (mockLiveEnabled) {
      mockDataGenerator.startLiveUpdates(true);
      const unsubscribe = mockDataGenerator.subscribe(() => {
        setRefreshKey((k) => k + 1);
      });
      return () => {
        unsubscribe();
        mockDataGenerator.startLiveUpdates(false);
      };
    }
  }, [mockLiveEnabled]);

  return useQuery({
    queryKey: ['visual-exposure', filters, refreshKey],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      let data = mockDataGenerator.getExposureData();

      if (filters.selectedRegions.length > 0) {
        data = data.filter((d) => filters.selectedRegions.includes(d.region));
      }
      if (filters.selectedCountries.length > 0) {
        data = data.filter((d) => d.country && filters.selectedCountries.includes(d.country));
      }
      if (filters.selectedAssetClasses.length > 0) {
        data = data.filter((d) => filters.selectedAssetClasses.includes(d.assetClass));
      }
      if (filters.selectedDesks.length > 0) {
        data = data.filter((d) => d.desk && filters.selectedDesks.includes(d.desk));
      }
      if (filters.selectedOffices.length > 0) {
        data = data.filter((d) => d.office && filters.selectedOffices.includes(d.office));
      }

      data = data.filter(
        (d) =>
          d.exposure >= filters.exposureRange[0] &&
          d.exposure <= filters.exposureRange[1] &&
          d.exposureDiff >= filters.exposureDiffRange[0] &&
          d.exposureDiff <= filters.exposureDiffRange[1] &&
          d.exposureRelToLimit >= filters.exposureRelToLimitRange[0] &&
          d.exposureRelToLimit <= filters.exposureRelToLimitRange[1]
      );

      const treemapData: TreemapNode = {
        name: 'Root',
        value: 0,
        children: [],
      };

      const byRegion: Record<string, TreemapNode> = {};

      data.forEach((d) => {
        if (!byRegion[d.region]) {
          byRegion[d.region] = {
            name: d.region,
            value: 0,
            children: [],
          };
        }
        byRegion[d.region].value += d.exposure;
        byRegion[d.region].children!.push({
          name: d.name,
          value: d.exposure,
          exposureRelToLimit: d.exposureRelToLimit,
          color: d.exposureRelToLimit > 0.8 ? '#ef4444' : d.exposureRelToLimit > 0.6 ? '#f97316' : d.exposureRelToLimit > 0.4 ? '#eab308' : '#3b82f6',
        });
      });

      treemapData.children = Object.values(byRegion);

      const scatterData: ScatterPoint[] = data.map((d) => ({
        id: d.id,
        name: d.name,
        x: d.exposure,
        y: d.exposureRelToLimit,
        size: d.var10day,
        color: d.region === 'North America' ? '#3b82f6' : d.region === 'Europe' ? '#22c55e' : d.region === 'Far East' ? '#eab308' : d.region === 'Middle East' ? '#f97316' : d.region === 'Australasia' ? '#a855f7' : '#64748b',
        category: d.region,
        metadata: { desk: d.desk, assetClass: d.assetClass },
      }));

      return { treemapData, scatterData, rawData: data };
    },
    staleTime: mockLiveEnabled ? 0 : 30000,
  });
}

export function useDeskPositions() {
  const [refreshKey, setRefreshKey] = useState(0);
  const mockLiveEnabled = useSettingsStore((state) => state.mockLiveEnabled);

  useEffect(() => {
    if (mockLiveEnabled) {
      mockDataGenerator.startLiveUpdates(true);
      const unsubscribe = mockDataGenerator.subscribe(() => {
        setRefreshKey((k) => k + 1);
      });
      return () => {
        unsubscribe();
        mockDataGenerator.startLiveUpdates(false);
      };
    }
  }, [mockLiveEnabled]);

  return useQuery({
    queryKey: ['desk-positions', refreshKey],
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

      const sentimentScatter: SentimentScatterPoint[] = positions.map((p) => ({
        symbol: p.symbol,
        netSentiment: p.sentiment * 100,
        priceChange: p.priceChangePercent,
        size: p.marketValue,
        color: (INDUSTRY_COLORS as any)[p.industry] || '#64748b',
      }));

      const spreadScatter: SpreadScatterPoint[] = positions.map((p) => ({
        symbol: p.symbol,
        spread: p.highLowSpread * 100,
        sentiment: p.sentiment,
        size: p.marketValue,
        color: (INDUSTRY_COLORS as any)[p.industry] || '#64748b',
      }));

      return { kpis, positionMapData, sentimentScatter, spreadScatter, rawPositions: positions };
    },
    staleTime: mockLiveEnabled ? 0 : 30000,
  });
}

export function useSymbolHistory(symbol: string) {
  const [refreshKey, setRefreshKey] = useState(0);
  const mockLiveEnabled = useSettingsStore((state) => state.mockLiveEnabled);

  useEffect(() => {
    if (mockLiveEnabled) {
      mockDataGenerator.startLiveUpdates(true);
      const unsubscribe = mockDataGenerator.subscribe(() => {
        setRefreshKey((k) => k + 1);
      });
      return () => {
        unsubscribe();
        mockDataGenerator.startLiveUpdates(false);
      };
    }
  }, [mockLiveEnabled]);

  return useQuery({
    queryKey: ['symbol-history', symbol, refreshKey],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return mockDataGenerator.getPriceHistory(symbol, 50);
    },
    staleTime: mockLiveEnabled ? 0 : 30000,
    enabled: !!symbol,
  });
}

export function useRegionTable(filters: FilterState) {
  const [refreshKey, setRefreshKey] = useState(0);
  const mockLiveEnabled = useSettingsStore((state) => state.mockLiveEnabled);

  useEffect(() => {
    if (mockLiveEnabled) {
      mockDataGenerator.startLiveUpdates(true);
      const unsubscribe = mockDataGenerator.subscribe(() => {
        setRefreshKey((k) => k + 1);
      });
      return () => {
        unsubscribe();
        mockDataGenerator.startLiveUpdates(false);
      };
    }
  }, [mockLiveEnabled]);

  return useQuery({
    queryKey: ['region-table', filters, refreshKey],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      let data = mockDataGenerator.getExposureData();

      if (filters.selectedRegions.length > 0) {
        data = data.filter((d) => filters.selectedRegions.includes(d.region));
      }
      if (filters.selectedCountries.length > 0) {
        data = data.filter((d) => d.country && filters.selectedCountries.includes(d.country));
      }
      if (filters.selectedAssetClasses.length > 0) {
        data = data.filter((d) => filters.selectedAssetClasses.includes(d.assetClass));
      }
      if (filters.selectedDesks.length > 0) {
        data = data.filter((d) => d.desk && filters.selectedDesks.includes(d.desk));
      }

      const rows: RegionTableRow[] = [];
      const byRegion: Record<string, ExposureData[]> = {};

      data.forEach((d) => {
        if (!byRegion[d.region]) byRegion[d.region] = [];
        byRegion[d.region].push(d);
      });

      Object.entries(byRegion).forEach(([region, items]) => {
        const regionRow: RegionTableRow = {
          id: `region-${region}`,
          level: 0,
          name: region,
          exposure: items.reduce((sum, d) => sum + d.exposure, 0),
          exposureRelToLimit: items.reduce((sum, d) => sum + d.exposure, 0) / items.reduce((sum, d) => sum + d.exposureLimit, 0),
          var1day: items.reduce((sum, d) => sum + d.var1day, 0),
          var1dayLimit: items.reduce((sum, d) => sum + d.var1dayLimit, 0),
          var10day: items.reduce((sum, d) => sum + d.var10day, 0),
          var10dayRelToLimit: items.reduce((sum, d) => sum + d.var10day, 0) / items.reduce((sum, d) => sum + d.var10dayLimit, 0),
          distribution: items.map((d) => d.exposureRelToLimit),
          children: [],
          expanded: false,
        };

        const byDesk: Record<string, ExposureData[]> = {};
        items.forEach((d) => {
          const desk = d.desk || 'Unknown';
          if (!byDesk[desk]) byDesk[desk] = [];
          byDesk[desk].push(d);
        });

        Object.entries(byDesk).forEach(([desk, deskItems]) => {
          regionRow.children!.push({
            id: `desk-${region}-${desk}`,
            level: 1,
            name: desk,
            exposure: deskItems.reduce((sum, d) => sum + d.exposure, 0),
            exposureRelToLimit: deskItems.reduce((sum, d) => sum + d.exposure, 0) / deskItems.reduce((sum, d) => sum + d.exposureLimit, 0),
            var1day: deskItems.reduce((sum, d) => sum + d.var1day, 0),
            var1dayLimit: deskItems.reduce((sum, d) => sum + d.var1dayLimit, 0),
            var10day: deskItems.reduce((sum, d) => sum + d.var10day, 0),
            var10dayRelToLimit: deskItems.reduce((sum, d) => sum + d.var10day, 0) / deskItems.reduce((sum, d) => sum + d.var10dayLimit, 0),
            distribution: deskItems.map((d) => d.exposureRelToLimit),
            expanded: false,
          });
        });

        rows.push(regionRow);
      });

      return rows;
    },
    staleTime: mockLiveEnabled ? 0 : 30000,
  });
}
