import { useState } from 'react';
import { Slider } from '@/components/ui/slider';

interface TimeBrushProps {
  start: number;
  end: number;
  onRangeChange: (start: number, end: number) => void;
}

export default function TimeBrush({ start, end, onRangeChange }: TimeBrushProps) {
  const [range, setRange] = useState([0, 100]);

  const handleChange = (values: number[]) => {
    setRange(values);
    const duration = end - start;
    const newStart = start + (duration * values[0]) / 100;
    const newEnd = start + (duration * values[1]) / 100;
    onRangeChange(newStart, newEnd);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{new Date(start).toLocaleTimeString()}</span>
        <span>Time Range</span>
        <span>{new Date(end).toLocaleTimeString()}</span>
      </div>
      <Slider
        min={0}
        max={100}
        step={1}
        value={range}
        onValueChange={handleChange}
        className="w-full"
      />
    </div>
  );
}
