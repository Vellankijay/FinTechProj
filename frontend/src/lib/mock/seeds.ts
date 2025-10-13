/**
 * Seed data for realistic mock generation
 */

export const SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', assetClass: 'Equities' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', assetClass: 'Equities' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', assetClass: 'Equities' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer', assetClass: 'Equities' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive', assetClass: 'Equities' },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', assetClass: 'Equities' },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Financials', assetClass: 'Equities' },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', assetClass: 'Equities' },
  { symbol: 'ES', name: 'E-mini S&P 500', sector: 'Index', assetClass: 'Futures' },
  { symbol: 'NQ', name: 'E-mini Nasdaq', sector: 'Index', assetClass: 'Futures' },
  { symbol: 'GC', name: 'Gold Futures', sector: 'Commodities', assetClass: 'Futures' },
  { symbol: 'CL', name: 'Crude Oil', sector: 'Commodities', assetClass: 'Futures' },
  { symbol: 'EURUSD', name: 'Euro/USD', sector: 'Currency', assetClass: 'FX' },
  { symbol: 'GBPUSD', name: 'Pound/USD', sector: 'Currency', assetClass: 'FX' },
  { symbol: 'USDJPY', name: 'USD/Yen', sector: 'Currency', assetClass: 'FX' },
  { symbol: 'US10Y', name: 'US 10Y Treasury', sector: 'Government', assetClass: 'Rates' },
  { symbol: 'US2Y', name: 'US 2Y Treasury', sector: 'Government', assetClass: 'Rates' },
];

export const DESKS = ['Alpha', 'Delta', 'Gamma', 'Omega'];

export const ALERT_TEMPLATES = [
  { severity: 'CRITICAL', message: 'VaR limit breach detected' },
  { severity: 'CRITICAL', message: 'Drawdown threshold exceeded' },
  { severity: 'WARN', message: 'Volatility spike detected' },
  { severity: 'WARN', message: 'Large position size on {symbol}' },
  { severity: 'WARN', message: 'Correlation shift detected' },
  { severity: 'INFO', message: 'Daily VaR calculation complete' },
  { severity: 'INFO', message: 'Position update: {symbol}' },
];

export interface PricePoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  exposure: number;
  riskClass: 'Low' | 'Medium' | 'High';
  desk: string;
}

export interface Alert {
  id: string;
  timestamp: number;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  message: string;
  symbol?: string;
  desk?: string;
}

export interface VaRPoint {
  timestamp: number;
  var: number;
  limit: number;
  upperBand: number;
  lowerBand: number;
  breach: boolean;
}
