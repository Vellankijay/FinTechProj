import { Treemap as RechartsTreemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { TreemapNode } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface TreemapProps {
  data: TreemapNode;
  dataKey?: string;
}

function CustomContent(props: any) {
  const { x, y, width, height, name, value, color } = props;

  // Guard against missing or invalid data
  if (width < 30 || height < 30 || !name || value === undefined || value === null) return null;

  const displayName = name && typeof name === 'string'
    ? (name.length > 12 ? name.substring(0, 12) + '...' : name)
    : '';

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color || '#3b82f6',
          stroke: '#ffffff',
          strokeWidth: 3,
          opacity: 0.95,
        }}
        className="transition-all hover:opacity-100 hover:brightness-110 cursor-pointer"
      />
      {width > 60 && height > 40 && displayName && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={Math.min(14, width / 8)}
            fontWeight="600"
          >
            {displayName}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={Math.min(12, width / 10)}
          >
            {formatCurrency(value, 0)}
          </text>
        </>
      )}
    </g>
  );
}

export function Treemap({ data, dataKey = 'value' }: TreemapProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsTreemap
        data={data.children || []}
        dataKey={dataKey}
        aspectRatio={4 / 3}
        stroke="hsl(var(--background))"
        content={<CustomContent />}
      >
        <Tooltip
          formatter={(value: number) => formatCurrency(value, 0)}
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '2px solid #3b82f6',
            borderRadius: '0.5rem',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          }}
          labelStyle={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '700',
          }}
        />
      </RechartsTreemap>
    </ResponsiveContainer>
  );
}
