// Core domain types for RiskPulse dashboard

export type Region = 'Global' | 'Australasia' | 'Europe' | 'Far East' | 'Middle East' | 'North America';

export type AssetClass = 'Public Equity' | 'Private Equity' | 'Venture Capital' | 'Debt Financing' | 'IPO Pipeline';

export type DrilldownLevel = 'global' | 'region' | 'country';

export interface BaseEntity {
  id: string;
  name: string;
  timestamp: number;
}

export interface ExposureData extends BaseEntity {
  region: Region;
  country?: string;
  desk?: string;
  office?: string;
  assetClass: AssetClass;
  exposure: number; // Current exposure value
  exposureLimit: number; // Max allowed exposure
  exposureRelToLimit: number; // Ratio: exposure / limit (0-1+)
  exposureDiff: number; // Change from previous period
  var1day: number; // 1-day Value at Risk
  var1dayLimit: number;
  var10day: number; // 10-day Value at Risk
  var10dayLimit: number;
  var10dayRelToLimit: number;
  dailyPnl: number; // Daily profit/loss
}

export interface HeatmapCell {
  region: Region;
  assetClass: AssetClass;
  value: number; // Exposure value
  exposureRelToLimit: number; // For color mapping
  count: number; // Number of positions
}

export interface TreemapNode {
  name: string;
  value: number;
  exposureRelToLimit?: number;
  color?: string;
  children?: TreemapNode[];
}

export interface ScatterPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  color: string;
  category: string; // desk, assetClass, or region
  metadata?: Record<string, any>;
}

export interface VaRDistribution {
  bucket: string; // e.g., "0-10%", "10-20%"
  count: number;
  percentage: number;
  color: string;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: number;
  unit?: string;
  change?: string; // % change
  trend?: 'up' | 'down' | 'neutral';
  status?: 'normal' | 'warning' | 'critical';
  sparkline?: number[]; // Historical values for mini chart
}

export interface SymbolPosition extends BaseEntity {
  symbol: string;
  industry: string;
  sector: string;
  desk: string;
  quantity: number;
  price: number;
  priceChangePercent: number;
  marketValue: number;
  highLowSpread: number; // (high - low) / low
  sentiment: number; // -1 to 1
  lastTradeSize: number;
}

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface RegionTableRow {
  id: string;
  level: number; // 0 = Global, 1 = Region, 2 = Desk
  name: string;
  exposure: number;
  exposureRelToLimit: number;
  var1day: number;
  var1dayLimit: number;
  var10day: number;
  var10dayRelToLimit: number;
  distribution: number[]; // For dot plot column
  children?: RegionTableRow[];
  expanded?: boolean;
}

export interface FilterState {
  exposureRange: [number, number];
  exposureDiffRange: [number, number];
  exposureRelToLimitRange: [number, number];
  selectedCountries: string[];
  selectedOffices: string[];
  selectedDesks: string[];
  selectedRegions: Region[];
  selectedAssetClasses: AssetClass[];
}

export interface SettingsState {
  theme: 'light' | 'dark';
  mockLiveEnabled: boolean;
  density: 'comfortable' | 'compact';
}

export interface SentimentScatterPoint {
  symbol: string;
  netSentiment: number; // x-axis: -100 to 100
  priceChange: number; // y-axis: % change
  size: number;
  color: string;
}

export interface SpreadScatterPoint {
  symbol: string;
  spread: number; // x-axis: high-low spread %
  sentiment: number; // y-axis: -1 to 1
  size: number;
  color: string;
}

// Chart color scales
export const EXPOSURE_COLOR_SCALE = {
  low: '#3b82f6', // blue
  medium: '#eab308', // yellow
  high: '#f97316', // orange
  critical: '#ef4444', // red
};

export const SENTIMENT_COLOR_SCALE = {
  negative: '#ef4444',
  neutral: '#eab308',
  positive: '#22c55e',
};

// Industry colors for Position Map
export const INDUSTRY_COLORS: Record<string, string> = {
  'Software & Cloud': '#3b82f6',        // blue
  'Hardware & Devices': '#06b6d4',      // cyan
  'AI & Data Science': '#8b5cf6',       // violet
  'Cybersecurity': '#ef4444',           // red
  'Medical Technology': '#22c55e',      // green
  'Biotechnology': '#84cc16',           // lime
  'Digital Health': '#14b8a6',          // teal
  'Healthcare IT': '#10b981',           // emerald
  'Pharma Tech': '#6366f1',             // indigo
  'Telemedicine': '#ec4899',            // pink
};
