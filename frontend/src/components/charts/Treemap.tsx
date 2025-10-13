import { Treemap as RechartsTreemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { TreemapNode } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface TreemapProps {
  data: TreemapNode;
  dataKey?: string;
}

function CustomContent(props: any) {
  const { x, y, width, height, name, value, color } = props;

  if (width < 30 || height < 30) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color || '#3b82f6',
          stroke: 'hsl(var(--background))',
          strokeWidth: 2,
          opacity: 0.9,
        }}
        className="transition-opacity hover:opacity-100"
      />
      {width > 60 && height > 40 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={Math.min(14, width / 8)}
            fontWeight="600"
          >
            {name.length > 12 ? name.substring(0, 12) + '...' : name}
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
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
        />
      </RechartsTreemap>
    </ResponsiveContainer>
  );
}
