interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

export default function Sparkline({
  data,
  width = 100,
  height = 30,
  color = 'currentColor',
  showArea = false,
}: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = showArea ? `${points} ${width},${height} 0,${height}` : '';

  return (
    <svg width={width} height={height} className="overflow-visible">
      {showArea && (
        <polygon fill={color} opacity="0.1" points={areaPoints} />
      )}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
