/**
 * Data adapters: Currently use mock generators
 * TODO: Replace with real data sources:
 * - Kaggle CSV ingestion (historical prices)
 * - Yahoo Finance API (real-time OHLCV)
 * - News sentiment API (NYTimes/Bloomberg → alerts)
 * - Backend WebSocket (replace sockets.ts)
 *
 * Set USE_MOCK = false when backend is ready
 */

import {
  generateIntradayTimestamps,
  generateOHLCVData,
  generateVaRData,
  generatePositions,
  generateAlerts,
  generateExposureByAsset,
} from '../mock/generator';
import type { PricePoint, Position, Alert, VaRPoint } from '../mock/seeds';

export const USE_MOCK = true; // TODO: Flip to false when real API is ready

/**
 * Fetch OHLCV data
 * TODO: Replace with Yahoo Finance or Kaggle CSV loader
 */
export async function fetchOHLCV(symbol: string): Promise<PricePoint[]> {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    const timestamps = generateIntradayTimestamps();
    return generateOHLCVData(symbol, timestamps, 100 + Math.random() * 100);
  }

  // TODO: Real implementation
  // const response = await fetch(`${API_BASE}/ohlcv/${symbol}`);
  // return response.json();
  return [];
}

/**
 * Fetch VaR timeline
 * TODO: Replace with actual risk calculation endpoint
 */
export async function fetchVaRTimeline(): Promise<VaRPoint[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const timestamps = generateIntradayTimestamps();
    return generateVaRData(timestamps, 50000, 75000);
  }

  // TODO: Real implementation
  // const response = await fetch(`${API_BASE}/risk/var`);
  // return response.json();
  return [];
}

/**
 * Fetch current positions
 * TODO: Connect to positions API
 */
export async function fetchPositions(): Promise<Position[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return generatePositions();
  }

  // TODO: Real implementation
  // const response = await fetch(`${API_BASE}/positions`);
  // return response.json();
  return [];
}

/**
 * Fetch alerts feed
 * TODO: Integrate news sentiment and risk alerts from backend
 */
export async function fetchAlerts(): Promise<Alert[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return generateAlerts(25);
  }

  // TODO: Real implementation
  // const response = await fetch(`${API_BASE}/alerts`);
  // return response.json();
  return [];
}

/**
 * Fetch exposure breakdown
 */
export async function fetchExposure(): Promise<{ name: string; value: number; fill: string }[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return generateExposureByAsset();
  }

  // TODO: Real implementation
  return [];
}
