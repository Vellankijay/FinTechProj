import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as currency
 */
export function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format number as percentage
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1e9) {
    return `${sign}${(abs / 1e9).toFixed(1)}B`;
  }
  if (abs >= 1e6) {
    return `${sign}${(abs / 1e6).toFixed(1)}M`;
  }
  if (abs >= 1e3) {
    return `${sign}${(abs / 1e3).toFixed(1)}K`;
  }
  return `${sign}${abs.toFixed(0)}`;
}

/**
 * Get color based on exposure relative to limit
 */
export function getExposureColor(exposureRelToLimit: number): string {
  if (exposureRelToLimit >= 0.9) return 'hsl(0, 84%, 60%)'; // Critical red
  if (exposureRelToLimit >= 0.75) return 'hsl(25, 95%, 53%)'; // High orange
  if (exposureRelToLimit >= 0.5) return 'hsl(45, 93%, 47%)'; // Medium yellow
  return 'hsl(217, 91%, 60%)'; // Low blue
}

/**
 * Get color based on sentiment (-1 to 1)
 */
export function getSentimentColor(sentiment: number): string {
  if (sentiment < -0.3) return 'hsl(0, 84%, 60%)'; // Negative
  if (sentiment > 0.3) return 'hsl(142, 71%, 45%)'; // Positive
  return 'hsl(45, 93%, 47%)'; // Neutral
}

/**
 * Get color based on price change
 */
export function getPriceChangeColor(change: number): string {
  if (change < 0) return 'hsl(0, 84%, 60%)'; // Loss
  if (change > 0) return 'hsl(142, 71%, 45%)'; // Gain
  return 'hsl(215, 14%, 50%)'; // Neutral
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate random number between min and max
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Format timestamp to time string (HH:MM:SS)
 */
export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(timestamp);
}

/**
 * Format timestamp to date string
 */
export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(timestamp);
}

/**
 * Calculate linear regression for scatter plot
 */
export function linearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  predict: (x: number) => number;
} {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0, predict: () => 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n, predict: () => sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    predict: (x: number) => slope * x + intercept,
  };
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
