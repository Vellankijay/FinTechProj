import type { Region, AssetClass } from '@/types';

export const REGIONS: Region[] = [
  'Global',
  'Australasia',
  'Europe',
  'Far East',
  'Middle East',
  'North America',
];

export const ASSET_CLASSES: AssetClass[] = [
  'Commodities',
  'Equity',
  'Fixed Income',
  'FX',
  'Mutual Funds',
];

export const COUNTRIES_BY_REGION: Record<Exclude<Region, 'Global'>, string[]> = {
  Australasia: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea'],
  Europe: ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Switzerland'],
  'Far East': ['Japan', 'China', 'South Korea', 'Hong Kong', 'Taiwan', 'Singapore'],
  'Middle East': ['UAE', 'Saudi Arabia', 'Qatar', 'Israel', 'Kuwait', 'Bahrain'],
  'North America': ['United States', 'Canada', 'Mexico'],
};

export const OFFICES = [
  'New York',
  'London',
  'Tokyo',
  'Hong Kong',
  'Singapore',
  'Sydney',
  'Frankfurt',
  'Paris',
  'Dubai',
  'Toronto',
  'Chicago',
  'San Francisco',
  'Mumbai',
  'Shanghai',
  'Seoul',
];

export const DESKS = [
  'Equity Trading',
  'Fixed Income',
  'FX Options',
  'Commodities',
  'Derivatives',
  'Credit',
  'Emerging Markets',
  'Prime Brokerage',
  'Structured Products',
  'Risk Management',
];

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Financials',
  'Energy',
  'Consumer Discretionary',
  'Industrials',
  'Materials',
  'Utilities',
  'Real Estate',
  'Consumer Staples',
];

export const SECTORS = [
  'Software',
  'Hardware',
  'Semiconductors',
  'Pharmaceuticals',
  'Biotechnology',
  'Banks',
  'Insurance',
  'Oil & Gas',
  'Renewable Energy',
  'Retail',
  'Automotive',
  'Aerospace',
  'Chemicals',
  'Metals & Mining',
  'Utilities',
  'REITs',
  'Food & Beverage',
];

export const SYMBOLS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'TSLA',
  'NVDA',
  'META',
  'JPM',
  'BAC',
  'WFC',
  'JNJ',
  'UNH',
  'PFE',
  'XOM',
  'CVX',
  'BRK.B',
  'V',
  'MA',
  'WMT',
  'PG',
  'KO',
  'PEP',
  'DIS',
  'NFLX',
  'CSCO',
  'INTC',
  'AMD',
  'ORCL',
  'CRM',
  'ADBE',
];

export function getAllCountries(): string[] {
  return Object.values(COUNTRIES_BY_REGION).flat();
}

export function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}
