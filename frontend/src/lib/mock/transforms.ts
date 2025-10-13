/**
 * Transform utilities for risk calculations (EWMA, drawdown, etc.)
 */

/**
 * Exponentially Weighted Moving Average (for volatility)
 */
export function ewmaVolatility(
  returns: number[],
  lambda: number = 0.94,
  window: number = 20
): number {
  if (returns.length < window) return 0;

  const recentReturns = returns.slice(-window);
  let ewma = recentReturns[0] ** 2;

  for (let i = 1; i < recentReturns.length; i++) {
    ewma = lambda * ewma + (1 - lambda) * recentReturns[i] ** 2;
  }

  return Math.sqrt(ewma);
}

/**
 * Calculate returns from price array
 */
export function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

/**
 * Calculate rolling drawdown
 */
export function calculateDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;

  let peak = prices[0];
  let maxDrawdown = 0;

  for (const price of prices) {
    if (price > peak) {
      peak = price;
    }
    const drawdown = (peak - price) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * VaR calculation via historical simulation
 */
export function calculateVaR(returns: number[], confidence: number = 0.95): number {
  if (returns.length === 0) return 0;

  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);

  return Math.abs(sorted[index] || 0);
}

/**
 * Generate normal random with Box-Muller transform
 */
export function randomNormal(mean: number = 0, stdDev: number = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Brownian motion price generator
 */
export function generateBrownianPrice(
  lastPrice: number,
  dt: number = 1 / 252, // daily increment
  drift: number = 0.0001,
  volatility: number = 0.02
): number {
  const shock = randomNormal(0, 1);
  const change = drift * dt + volatility * Math.sqrt(dt) * shock;
  return lastPrice * (1 + change);
}
