import { Card } from '@/components/ui/card';
import { Treemap } from '@/components/charts/Treemap';
import { Scatter } from '@/components/charts/Scatter';
import { RegionTable } from '@/components/data-display/RegionTable';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { mockDataGenerator } from '@/lib/mock/generator';
import type { TreemapNode, ScatterPoint, RegionTableRow } from '@/types';

export default function Visual() {
  const { data, isLoading } = useQuery({
    queryKey: ['visual-page-data'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const rawData = mockDataGenerator.getExposureData();

      // Build treemap
      const treemapData: TreemapNode = {
        name: 'Root',
        value: 0,
        children: [],
      };

      const byRegion: Record<string, TreemapNode> = {};

      rawData.forEach((d) => {
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
          color:
            d.exposureRelToLimit > 0.8
              ? '#ef4444'
              : d.exposureRelToLimit > 0.6
              ? '#f97316'
              : d.exposureRelToLimit > 0.4
              ? '#eab308'
              : '#3b82f6',
        });
      });

      treemapData.children = Object.values(byRegion);

      // Build scatter
      const scatterData: ScatterPoint[] = rawData.map((d) => ({
        id: d.id,
        name: d.name,
        x: d.exposure,
        y: d.exposureRelToLimit,
        size: d.var10day,
        color:
          d.region === 'North America'
            ? '#3b82f6'
            : d.region === 'Europe'
            ? '#22c55e'
            : d.region === 'Far East'
            ? '#eab308'
            : d.region === 'Middle East'
            ? '#f97316'
            : d.region === 'Australasia'
            ? '#a855f7'
            : '#64748b',
        category: d.region,
        metadata: { desk: d.desk, assetClass: d.assetClass },
      }));

      // Build table
      const rows: RegionTableRow[] = [];
      const byRegionTable: Record<string, any[]> = {};

      rawData.forEach((d) => {
        if (!byRegionTable[d.region]) byRegionTable[d.region] = [];
        byRegionTable[d.region].push(d);
      });

      Object.entries(byRegionTable).forEach(([region, items]) => {
        const regionRow: RegionTableRow = {
          id: `region-${region}`,
          level: 0,
          name: region,
          exposure: items.reduce((sum, d) => sum + d.exposure, 0),
          exposureRelToLimit:
            items.reduce((sum, d) => sum + d.exposure, 0) /
            items.reduce((sum, d) => sum + d.exposureLimit, 0),
          var1day: items.reduce((sum, d) => sum + d.var1day, 0),
          var1dayLimit: items.reduce((sum, d) => sum + d.var1dayLimit, 0),
          var10day: items.reduce((sum, d) => sum + d.var10day, 0),
          var10dayRelToLimit:
            items.reduce((sum, d) => sum + d.var10day, 0) /
            items.reduce((sum, d) => sum + d.var10dayLimit, 0),
          distribution: items.map((d) => d.exposureRelToLimit),
          children: [],
          expanded: false,
        };

        const byDesk: Record<string, any[]> = {};
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
            exposureRelToLimit:
              deskItems.reduce((sum, d) => sum + d.exposure, 0) /
              deskItems.reduce((sum, d) => sum + d.exposureLimit, 0),
            var1day: deskItems.reduce((sum, d) => sum + d.var1day, 0),
            var1dayLimit: deskItems.reduce((sum, d) => sum + d.var1dayLimit, 0),
            var10day: deskItems.reduce((sum, d) => sum + d.var10day, 0),
            var10dayRelToLimit:
              deskItems.reduce((sum, d) => sum + d.var10day, 0) /
              deskItems.reduce((sum, d) => sum + d.var10dayLimit, 0),
            distribution: deskItems.map((d) => d.exposureRelToLimit),
            expanded: false,
          });
        });

        rows.push(regionRow);
      });

      return { treemapData, scatterData, tableData: rows, rawData };
    },
    staleTime: Infinity, // Data never becomes stale
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Visual Exposure Analytics</h1>
        <div className="text-sm text-muted-foreground">
          Showing {data?.rawData?.length || 0} positions
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">Exposure Treemap</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Size = Exposure, Color = Relative to Limit
          </p>
          <div className="h-[400px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <Treemap data={data?.treemapData || { name: 'Root', value: 0 }} />
            )}
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">Exposure Scatter</h2>
          <p className="text-sm text-muted-foreground mb-4">
            X = Exposure, Y = Rel to Limit, Size = 10d VaR
          </p>
          <div className="h-[400px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <Scatter
                data={data?.scatterData || []}
                xLabel="Exposure"
                yLabel="Relative to Limit"
                showRegression={true}
              />
            )}
          </div>
        </Card>
      </div>

      <Card className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-4">Hierarchical Region Table</h2>
        <div className="max-h-[600px] overflow-auto">
          {isLoading ? (
            <Skeleton className="w-full h-[400px]" />
          ) : (
            <RegionTable data={data?.tableData || []} />
          )}
        </div>
      </Card>
    </div>
  );
}
