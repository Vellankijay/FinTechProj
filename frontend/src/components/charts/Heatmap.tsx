import type { HeatmapCell, Region, AssetClass } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface HeatmapProps {
  data: HeatmapCell[];
  rows: Region[];
  columns: AssetClass[];
}

function getColorForRatio(ratio: number): string {
  if (ratio >= 1.0) return 'bg-red-500';
  if (ratio >= 0.8) return 'bg-orange-500';
  if (ratio >= 0.6) return 'bg-yellow-500';
  if (ratio >= 0.4) return 'bg-blue-500';
  return 'bg-blue-600';
}

export function Heatmap({ data, rows, columns }: HeatmapProps) {
  const cellLookup = new Map<string, HeatmapCell>();
  data.forEach((cell) => {
    cellLookup.set(`${cell.region}-${cell.assetClass}`, cell);
  });

  return (
    <div className="w-full overflow-auto pb-2">
      <div className="inline-block min-w-max">
        <div className="grid gap-2" style={{ gridTemplateColumns: `180px repeat(${columns.length}, minmax(110px, 1fr))` }}>
          {/* Header row */}
          <div className="p-2 font-semibold text-sm"></div>
          {columns.map((col) => (
            <div key={col} className="p-2 text-xs font-semibold text-center text-foreground">
              {col}
            </div>
          ))}

          {/* Data rows */}
          {rows.map((row) => (
            <div key={row} className="contents">
              <div className="flex items-center p-2 text-sm font-semibold text-right pr-4 whitespace-nowrap">
                {row}
              </div>
              {columns.map((col) => {
                const cell = cellLookup.get(`${row}-${col}`);
                if (!cell) {
                  return (
                    <div
                      key={`${row}-${col}`}
                      className="min-h-[70px] bg-muted/20 rounded-lg"
                    />
                  );
                }
                return (
                  <div
                    key={`${row}-${col}`}
                    className={cn(
                      'min-h-[70px] rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-lg p-2',
                      getColorForRatio(cell.exposureRelToLimit)
                    )}
                    title={`${row} - ${col}\n${formatCurrency(cell.value, 0)}\n${(cell.exposureRelToLimit * 100).toFixed(1)}% of limit\nPositions: ${cell.count}`}
                  >
                    <span className="text-lg font-bold text-white">{cell.count}</span>
                    <span className="text-[10px] font-medium text-white/80 mt-1">
                      {(cell.exposureRelToLimit * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-600" />
            <span className="text-muted-foreground">&lt;40%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-muted-foreground">40-60%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span className="text-muted-foreground">60-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-muted-foreground">80-100%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-muted-foreground">&gt;100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
