/**
 * Mock data generator for RiskPulse
 * Generates realistic OHLCV, VaR, positions, and alerts
 */

import {
  SYMBOLS,
  DESKS,
  ALERT_TEMPLATES,
  type PricePoint,
  type Position,
  type Alert,
  type VaRPoint,
} from './seeds';
import { generateBrownianPrice, ewmaVolatility, calculateReturns, calculateVaR } from './transforms';

// Market session: 9:30 AM - 4:00 PM ET (in milliseconds)
const MARKET_OPEN_HOUR = 9;
const MARKET_OPEN_MINUTE = 30;
const MARKET_CLOSE_HOUR = 16;

/**
 * Generate intraday timestamps (every 5 minutes)
 */
export function generateIntradayTimestamps(date: Date = new Date()): number[] {
  const timestamps: number[] = [];
  const start = new Date(date);
  start.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);

  const end = new Date(date);
  end.setHours(MARKET_CLOSE_HOUR, 0, 0, 0);

  let current = start.getTime();
  while (current <= end.getTime()) {
    timestamps.push(current);
    current += 5 * 60 * 1000; // 5 minutes
  }

  return timestamps;
}

/**
 * Generate realistic OHLCV data
 */
export function generateOHLCVData(
  symbol: string,
  timestamps: number[],
  basePrice: number = 100
): PricePoint[] {
  const data: PricePoint[] = [];
  let lastClose = basePrice;

  for (const ts of timestamps) {
    const open = lastClose;
    const vol = 0.015 + Math.random() * 0.01; // 1.5-2.5% volatility

    // Generate OHLC with brownian motion
    const c1 = generateBrownianPrice(open, 1 / 78, 0, vol);
    const c2 = generateBrownianPrice(c1, 1 / 78, 0, vol);
    const c3 = generateBrownianPrice(c2, 1 / 78, 0, vol);
    const close = generateBrownianPrice(c3, 1 / 78, 0, vol);

    const prices = [open, c1, c2, c3, close];
    const high = Math.max(...prices);
    const low = Math.min(...prices);

    data.push({
      timestamp: ts,
      open,
      high,
      low,
      close,
      volume: Math.floor(1000000 + Math.random() * 5000000),
    });

    lastClose = close;
  }

  return data;
}

/**
 * Generate VaR timeline with limit bands and breaches
 */
export function generateVaRData(
  timestamps: number[],
  baseVaR: number = 50000,
  limit: number = 75000
): VaRPoint[] {
  const data: VaRPoint[] = [];
  let lastVaR = baseVaR;

  for (let i = 0; i < timestamps.length; i++) {
    // VaR drifts with occasional spikes
    const drift = (Math.random() - 0.5) * 0.05;
    const spike = Math.random() < 0.05 ? 1.3 : 1; // 5% chance of spike
    lastVaR = Math.max(10000, lastVaR * (1 + drift) * spike);

    const upperBand = limit * 1.1;
    const lowerBand = limit * 0.9;
    const breach = lastVaR > limit;

    data.push({
      timestamp: timestamps[i],
      var: lastVaR,
      limit,
      upperBand,
      lowerBand,
      breach,
    });
  }

  return data;
}

/**
 * Generate random positions
 */
export function generatePositions(): Position[] {
  return SYMBOLS.slice(0, 12).map((s) => {
    const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
    const qty = Math.floor(100 + Math.random() * 900);
    const avgPrice = 50 + Math.random() * 150;
    const currentPrice = avgPrice * (1 + (Math.random() - 0.5) * 0.1);
    const pnl = side === 'LONG' ? (currentPrice - avgPrice) * qty : (avgPrice - currentPrice) * qty;
    const exposure = currentPrice * qty;

    let riskClass: 'Low' | 'Medium' | 'High' = 'Low';
    if (s.assetClass === 'Futures' || s.assetClass === 'FX') riskClass = 'High';
    else if (Math.abs(pnl / exposure) > 0.05) riskClass = 'Medium';

    return {
      symbol: s.symbol,
      side,
      quantity: qty,
      avgPrice,
      currentPrice,
      pnl,
      exposure,
      riskClass,
      desk: DESKS[Math.floor(Math.random() * DESKS.length)],
    };
  });
}

/**
 * Generate alert feed
 */
export function generateAlerts(count: number = 20): Alert[] {
  const alerts: Alert[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const template = ALERT_TEMPLATES[Math.floor(Math.random() * ALERT_TEMPLATES.length)];
    const symbol = Math.random() > 0.5 ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].symbol : undefined;
    const desk = Math.random() > 0.6 ? DESKS[Math.floor(Math.random() * DESKS.length)] : undefined;

    alerts.push({
      id: `alert-${i}-${now}`,
      timestamp: now - i * 60000 * 5, // staggered by 5 minutes
      severity: template.severity as 'INFO' | 'WARN' | 'CRITICAL',
      message: template.message.replace('{symbol}', symbol || 'N/A'),
      symbol,
      desk,
    });
  }

  return alerts.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Generate exposure by asset class (for heatmap/treemap)
 */
export function generateExposureByAsset(): { name: string; value: number; fill: string }[] {
  return [
    { name: 'Equities', value: 1500000 + Math.random() * 500000, fill: '#3b82f6' },
    { name: 'Futures', value: 800000 + Math.random() * 300000, fill: '#8b5cf6' },
    { name: 'FX', value: 600000 + Math.random() * 200000, fill: '#14b8a6' },
    { name: 'Rates', value: 400000 + Math.random() * 150000, fill: '#f59e0b' },
    { name: 'Credit', value: 300000 + Math.random() * 100000, fill: '#ef4444' },
  ];
}
