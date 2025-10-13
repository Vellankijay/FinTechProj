import type { ExposureData, SymbolPosition, TimeSeriesPoint, Region } from '@/types';
import {
  REGIONS,
  ASSET_CLASSES,
  COUNTRIES_BY_REGION,
  OFFICES,
  DESKS,
  INDUSTRIES,
  SECTORS,
  SYMBOLS,
  getRandomElement,
} from './seeds';
import { generateBrownianPrice } from './transforms';

class MockDataGenerator {
  private exposureData: Map<string, ExposureData> = new Map();
  private symbolPositions: Map<string, SymbolPosition> = new Map();
  private priceHistory: Map<string, number[]> = new Map();
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    let id = 0;

    REGIONS.filter((r) => r !== 'Global').forEach((region) => {
      const regionCountries = COUNTRIES_BY_REGION[region as Exclude<Region, 'Global'>];

      regionCountries.forEach((country) => {
        ASSET_CLASSES.forEach((assetClass) => {
          const numEntries = Math.floor(Math.random() * 3) + 2;

          for (let i = 0; i < numEntries; i++) {
            const exposure = 10000000 + Math.random() * 90000000;
            const exposureLimit = exposure * (1.1 + Math.random() * 0.5);
            const exposureRelToLimit = exposure / exposureLimit;

            const entry: ExposureData = {
              id: `exp-${id++}`,
              name: `${country}-${assetClass}-${i}`,
              timestamp: Date.now(),
              region,
              country,
              desk: getRandomElement(DESKS),
              office: getRandomElement(OFFICES),
              assetClass,
              exposure,
              exposureLimit,
              exposureRelToLimit,
              exposureDiff: (Math.random() - 0.5) * 10000000,
              var1day: exposure * (0.01 + Math.random() * 0.02),
              var1dayLimit: exposure * 0.03,
              var10day: exposure * (0.03 + Math.random() * 0.05),
              var10dayLimit: exposure * 0.08,
              var10dayRelToLimit: 0,
              dailyPnl: (Math.random() - 0.5) * exposure * 0.02,
            };

            entry.var10dayRelToLimit = entry.var10day / entry.var10dayLimit;
            this.exposureData.set(entry.id, entry);
          }
        });
      });
    });

    SYMBOLS.forEach((symbol, idx) => {
      const industry = getRandomElement(INDUSTRIES);
      const sector = getRandomElement(SECTORS);
      const quantity = 1000 + Math.random() * 9000;
      const price = 50 + Math.random() * 200;

      const position: SymbolPosition = {
        id: `pos-${idx}`,
        name: symbol,
        timestamp: Date.now(),
        symbol,
        industry,
        sector,
        desk: getRandomElement(DESKS),
        quantity,
        price,
        priceChangePercent: (Math.random() - 0.5) * 10,
        marketValue: quantity * price,
        highLowSpread: Math.random() * 0.05,
        sentiment: (Math.random() - 0.5) * 2,
        lastTradeSize: Math.floor(Math.random() * 1000),
      };

      this.symbolPositions.set(symbol, position);
      this.priceHistory.set(symbol, [price]);
    });
  }

  public startLiveUpdates(enabled: boolean) {
    if (enabled && !this.updateInterval) {
      this.updateInterval = setInterval(() => {
        this.tick();
      }, 600 + Math.random() * 200);
    } else if (!enabled && this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private tick() {
    this.exposureData.forEach((entry) => {
      const prevExposure = entry.exposure;
      const change = (Math.random() - 0.5) * entry.exposure * 0.001;
      entry.exposure = Math.max(0, entry.exposure + change);
      entry.exposureRelToLimit = entry.exposure / entry.exposureLimit;
      entry.exposureDiff = entry.exposure - prevExposure;
      entry.var1day = entry.exposure * (0.01 + Math.random() * 0.02);
      entry.var10day = entry.exposure * (0.03 + Math.random() * 0.05);
      entry.var10dayRelToLimit = entry.var10day / entry.var10dayLimit;
      entry.dailyPnl = (Math.random() - 0.5) * entry.exposure * 0.02;
      entry.timestamp = Date.now();
    });

    this.symbolPositions.forEach((position) => {
      const lastPrice = position.price;
      const newPrice = generateBrownianPrice(lastPrice, 1 / 252, 0, 0.02);
      position.price = newPrice;
      position.priceChangePercent = ((newPrice - lastPrice) / lastPrice) * 100;
      position.marketValue = position.quantity * newPrice;
      position.highLowSpread = Math.random() * 0.05;
      position.sentiment = Math.max(-1, Math.min(1, position.sentiment + (Math.random() - 0.5) * 0.1));
      position.timestamp = Date.now();

      const history = this.priceHistory.get(position.symbol) || [];
      history.push(newPrice);
      if (history.length > 100) history.shift();
      this.priceHistory.set(position.symbol, history);
    });

    this.notifyListeners();
  }

  public subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb());
  }

  public getExposureData(): ExposureData[] {
    return Array.from(this.exposureData.values());
  }

  public getSymbolPositions(): SymbolPosition[] {
    return Array.from(this.symbolPositions.values());
  }

  public getPriceHistory(symbol: string, length: number = 50): TimeSeriesPoint[] {
    const history = this.priceHistory.get(symbol) || [];
    const now = Date.now();
    return history.slice(-length).map((value, idx) => ({
      timestamp: now - (history.length - 1 - idx) * 60000,
      value,
    }));
  }
}

export const mockDataGenerator = new MockDataGenerator();
