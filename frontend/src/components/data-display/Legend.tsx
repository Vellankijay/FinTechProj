import { INDUSTRY_COLORS } from '@/types';

export function Legend() {
  const industries = Object.keys(INDUSTRY_COLORS);

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-card/50 rounded-xl border border-border">
      {industries.map((industry) => (
        <div key={industry} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: INDUSTRY_COLORS[industry] }}
          />
          <span className="text-sm text-muted-foreground">{industry}</span>
        </div>
      ))}
    </div>
  );
}
