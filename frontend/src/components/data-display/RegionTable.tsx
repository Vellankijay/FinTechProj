import { useState } from 'react';
import type { RegionTableRow } from '@/types';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface RegionTableProps {
  data: RegionTableRow[];
}

function DotPlot({ values }: { values: number[] }) {
  return (
    <div className="flex items-center gap-0.5 h-6">
      {values.slice(0, 10).map((value, idx) => (
        <div
          key={idx}
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor:
              value > 0.8 ? '#ef4444' : value > 0.6 ? '#f97316' : value > 0.4 ? '#eab308' : '#3b82f6',
          }}
          title={formatPercent(value)}
        />
      ))}
      {values.length > 10 && (
        <span className="text-xs text-muted-foreground ml-1">+{values.length - 10}</span>
      )}
    </div>
  );
}

function BarInCell({ value, limit }: { value: number; limit: number }) {
  const percentage = Math.min((value / limit) * 100, 100);
  const color = percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-orange-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <div className="relative h-6 bg-muted/20 rounded-full overflow-hidden">
      <div className={cn('h-full transition-all', color)} style={{ width: `${percentage}%` }} />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}

export function RegionTable({ data }: RegionTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const renderRow = (row: RegionTableRow): React.ReactNode => {
    const isExpanded = expanded.has(row.id);
    const hasChildren = row.children && row.children.length > 0;

    return (
      <>
        <tr
          key={row.id}
          className={cn(
            'border-b border-border hover:bg-muted/50 transition-colors',
            row.level === 0 && 'font-semibold bg-muted/20',
            row.level === 1 && 'bg-muted/10'
          )}
        >
          <td className="p-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${row.level * 24}px` }}>
              {hasChildren && (
                <button onClick={() => toggleRow(row.id)} className="hover:bg-muted p-1 rounded">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              <span>{row.name}</span>
            </div>
          </td>
          <td className="p-3 text-right">{formatCurrency(row.exposure, 0)}</td>
          <td className="p-3">
            <BarInCell value={row.exposure} limit={row.exposure / row.exposureRelToLimit} />
          </td>
          <td className="p-3 text-right">{formatCurrency(row.var1day, 0)}</td>
          <td className="p-3">
            <BarInCell value={row.var1day} limit={row.var1dayLimit} />
          </td>
          <td className="p-3 text-right">{formatCurrency(row.var10day, 0)}</td>
          <td className="p-3">
            <BarInCell value={row.var10day} limit={row.var10day / row.var10dayRelToLimit} />
          </td>
          <td className="p-3">
            <DotPlot values={row.distribution} />
          </td>
        </tr>
        {isExpanded && hasChildren && row.children!.map((child) => renderRow(child))}
      </>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/30 border-b border-border sticky top-0">
          <tr>
            <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Region/Desk</th>
            <th className="p-3 text-right text-xs font-medium text-muted-foreground uppercase">Exposure</th>
            <th className="p-3 text-center text-xs font-medium text-muted-foreground uppercase">Exp vs Limit</th>
            <th className="p-3 text-right text-xs font-medium text-muted-foreground uppercase">VaR 1d</th>
            <th className="p-3 text-center text-xs font-medium text-muted-foreground uppercase">VaR 1d vs Limit</th>
            <th className="p-3 text-right text-xs font-medium text-muted-foreground uppercase">VaR 10d</th>
            <th className="p-3 text-center text-xs font-medium text-muted-foreground uppercase">VaR 10d vs Limit</th>
            <th className="p-3 text-center text-xs font-medium text-muted-foreground uppercase">Distribution</th>
          </tr>
        </thead>
        <tbody>{data.map((row) => renderRow(row))}</tbody>
      </table>
    </div>
  );
}
