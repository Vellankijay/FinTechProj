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
  if (width < 25 || height < 25 || !name || value === undefined || value === null) return null;

  // Calculate responsive font sizes - name larger, value smaller
  const nameFontSize = Math.max(11, Math.min(18, width / 5));
  const valueFontSize = Math.max(8, Math.min(11, width / 10));

  // Smart text truncation
  const maxChars = Math.floor(width / (nameFontSize * 0.55));
  const displayName = name && typeof name === 'string'
    ? (name.length > maxChars ? name.substring(0, Math.max(3, maxChars - 2)) + '...' : name)
    : '';

  // Show text if there's reasonable space
  const showText = width > 45 && height > 30;
  const showValue = width > 65 && height > 45;

  return (
    <g>
      {/* Simple solid rectangle with clean borders */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color || '#3b82f6'}
        stroke="#000000"
        strokeWidth={1}
        opacity={0.9}
        className="transition-all hover:opacity-100 cursor-pointer"
      />

      {showText && displayName && (
        <>
          {/* Country/Name - Prominent and forward */}
          <text
            x={x + width / 2}
            y={y + height / 2 - (showValue ? 6 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize={nameFontSize}
            fontWeight="800"
            fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          >
            {displayName}
          </text>

          {/* Value - Subtle and in background */}
          {showValue && (
            <text
              x={x + width / 2}
              y={y + height / 2 + nameFontSize - 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize={valueFontSize}
              fontWeight="400"
              fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              opacity={0.7}
            >
              {formatCurrency(value, 0)}
            </text>
          )}
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
            backgroundColor: '#000000',
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
          itemStyle={{
            color: '#ffffff',
            fontSize: '13px',
          }}
        />
      </RechartsTreemap>
    </ResponsiveContainer>
  );
}
