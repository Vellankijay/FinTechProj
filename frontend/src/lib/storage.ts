/**
 * Type-safe localStorage wrapper with fallback
 */

interface StorageKeys {
  theme: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  drawdownThreshold: number;
  volZScoreThreshold: number;
  varAlpha: number;
  apiBaseUrl: string;
}

export const storage = {
  get<K extends keyof StorageKeys>(key: K): StorageKeys[K] | null {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as StorageKeys[K]) : null;
    } catch {
      return null;
    }
  },

  set<K extends keyof StorageKeys>(key: K, value: StorageKeys[K]): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to write to localStorage', error);
    }
  },

  remove(key: keyof StorageKeys): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage', error);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage', error);
    }
  },
};

// Defaults
export const STORAGE_DEFAULTS: StorageKeys = {
  theme: 'dark',
  density: 'comfortable',
  drawdownThreshold: 0.05,
  volZScoreThreshold: 2.5,
  varAlpha: 0.95,
  apiBaseUrl: 'http://localhost:8000',
};
