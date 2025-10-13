import { useState, Fragment } from 'react';
import type { RegionTableRow } from '@/types';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface RegionTableProps {
  data: RegionTableRow[];
}

function DotPlot({ values }: { values: number[] }) {
  return (
    <div className="flex items-center gap-1 h-6">
      {values.slice(0, 10).map((value, idx) => (
        <div
          key={idx}
          className="w-3 h-3 rounded-full border-2 border-white shadow-md hover:scale-125 transition-transform cursor-pointer"
          style={{
            backgroundColor:
              value > 0.8 ? '#ef4444' : value > 0.6 ? '#f97316' : value > 0.4 ? '#eab308' : '#3b82f6',
          }}
          title={formatPercent(value)}
        />
      ))}
      {values.length > 10 && (
        <span className="text-xs font-semibold text-muted-foreground ml-1">+{values.length - 10}</span>
      )}
    </div>
  );
}

function BarInCell({ value, limit }: { value: number; limit: number }) {
  // Guard against division by zero and invalid values
  const safeLimit = limit && isFinite(limit) && limit > 0 ? limit : 1;
  const percentage = Math.min((value / safeLimit) * 100, 100);
  const safePercentage = isFinite(percentage) ? percentage : 0;
  const color = safePercentage > 80 ? 'bg-red-500' : safePercentage > 60 ? 'bg-orange-500' : safePercentage > 40 ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <div className="relative h-7 bg-muted/30 rounded-full overflow-hidden border border-border">
      <div className={cn('h-full transition-all shadow-inner', color)} style={{ width: `${safePercentage}%` }} />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
        {safePercentage.toFixed(0)}%
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
            'border-b border-border hover:bg-blue-500/20 hover:shadow-lg transition-all cursor-pointer',
            row.level === 0 && 'font-semibold bg-muted/30',
            row.level === 1 && 'bg-muted/15'
          )}
        >
          <td className="p-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${row.level * 24}px` }}>
              {hasChildren && (
                <button onClick={() => toggleRow(row.id)} className="hover:bg-blue-500/30 hover:scale-110 p-1.5 rounded transition-all">
                  {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              )}
              <span>{row.name}</span>
            </div>
          </td>
          <td className="p-3 text-right">{formatCurrency(row.exposure, 0)}</td>
          <td className="p-3">
            <BarInCell value={row.exposure} limit={row.exposureRelToLimit > 0 ? row.exposure / row.exposureRelToLimit : row.exposure} />
          </td>
          <td className="p-3 text-right">{formatCurrency(row.var1day, 0)}</td>
          <td className="p-3">
            <BarInCell value={row.var1day} limit={row.var1dayLimit} />
          </td>
          <td className="p-3 text-right">{formatCurrency(row.var10day, 0)}</td>
          <td className="p-3">
            <BarInCell value={row.var10day} limit={row.var10dayRelToLimit > 0 ? row.var10day / row.var10dayRelToLimit : row.var10day} />
          </td>
          <td className="p-3">
            <DotPlot values={row.distribution} />
          </td>
        </tr>
        {isExpanded && hasChildren && row.children!.map((child) => (
          <Fragment key={child.id}>{renderRow(child)}</Fragment>
        ))}
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
