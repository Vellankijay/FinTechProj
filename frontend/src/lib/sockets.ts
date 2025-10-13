/**
 * Mock "live" streaming via RxJS
 * Simulates WebSocket tick updates for prices, VaR, and alerts
 *
 * TODO: Replace with real WebSocket connection to backend
 * Example:
 *   const ws = new WebSocket('ws://localhost:8000/stream');
 *   ws.onmessage = (event) => { ... };
 */

import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { generateBrownianPrice } from './mock/transforms';
import type { Alert } from './mock/seeds';

/**
 * Mock price stream: emits new price every 500-750ms
 */
export function openPriceStream(symbol: string, initialPrice: number = 100): Observable<number> {
  return interval(500 + Math.random() * 250).pipe(
    map(() => {
      initialPrice = generateBrownianPrice(initialPrice, 1 / 78, 0, 0.015);
      return initialPrice;
    })
  );
}

/**
 * Mock VaR stream: emits updated VaR every 1 second
 */
export function openVaRStream(baseVaR: number = 50000): Observable<number> {
  let currentVaR = baseVaR;
  return interval(1000).pipe(
    map(() => {
      const drift = (Math.random() - 0.5) * 0.05;
      const spike = Math.random() < 0.03 ? 1.25 : 1;
      currentVaR = Math.max(10000, currentVaR * (1 + drift) * spike);
      return currentVaR;
    })
  );
}

/**
 * Mock alert stream: emits sporadic alerts
 */
export function openAlertStream(): Observable<Alert> {
  return interval(10000 + Math.random() * 20000).pipe(
    map(() => ({
      id: `alert-${Date.now()}`,
      timestamp: Date.now(),
      severity: (['INFO', 'WARN', 'CRITICAL'] as const)[Math.floor(Math.random() * 3)],
      message: 'New alert: Market volatility detected',
      symbol: 'AAPL',
    }))
  );
}
