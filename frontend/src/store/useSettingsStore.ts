import { create } from 'zustand';
import type { SettingsState } from '@/types';

interface SettingsStore extends SettingsState {
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setMockLiveEnabled: (enabled: boolean) => void;
  setDensity: (density: 'comfortable' | 'compact') => void;
}

// Initialize dark theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('riskpulse-theme');
  if (stored === 'dark' || !stored) {
    document.documentElement.classList.add('dark');
  }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  theme: (typeof window !== 'undefined' && localStorage.getItem('riskpulse-theme') as 'light' | 'dark') || 'dark',
  mockLiveEnabled: (typeof window !== 'undefined' && localStorage.getItem('riskpulse-mock-live') === 'true') ?? true,
  density: (typeof window !== 'undefined' && localStorage.getItem('riskpulse-density') as 'comfortable' | 'compact') || 'comfortable',

  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('riskpulse-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  setMockLiveEnabled: (enabled) => {
    set({ mockLiveEnabled: enabled });
    if (typeof window !== 'undefined') {
      localStorage.setItem('riskpulse-mock-live', String(enabled));
    }
  },

  setDensity: (density) => {
    set({ density });
    if (typeof window !== 'undefined') {
      localStorage.setItem('riskpulse-density', density);
    }
  },
}));
