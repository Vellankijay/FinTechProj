import { create } from 'zustand';
import type { FilterState, Region, AssetClass } from '@/types';

interface FiltersStore extends FilterState {
  setExposureRange: (range: [number, number]) => void;
  setExposureDiffRange: (range: [number, number]) => void;
  setExposureRelToLimitRange: (range: [number, number]) => void;
  setSelectedCountries: (countries: string[]) => void;
  setSelectedOffices: (offices: string[]) => void;
  setSelectedDesks: (desks: string[]) => void;
  setSelectedRegions: (regions: Region[]) => void;
  setSelectedAssetClasses: (assetClasses: AssetClass[]) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  exposureRange: [0, 1000000000],
  exposureDiffRange: [-100000000, 100000000],
  exposureRelToLimitRange: [0, 1],
  selectedCountries: [],
  selectedOffices: [],
  selectedDesks: [],
  selectedRegions: [],
  selectedAssetClasses: [],
};

export const useFiltersStore = create<FiltersStore>((set) => ({
  ...defaultFilters,
  setExposureRange: (range) => set({ exposureRange: range }),
  setExposureDiffRange: (range) => set({ exposureDiffRange: range }),
  setExposureRelToLimitRange: (range) => set({ exposureRelToLimitRange: range }),
  setSelectedCountries: (countries) => set({ selectedCountries: countries }),
  setSelectedOffices: (offices) => set({ selectedOffices: offices }),
  setSelectedDesks: (desks) => set({ selectedDesks: desks }),
  setSelectedRegions: (regions) => set({ selectedRegions: regions }),
  setSelectedAssetClasses: (assetClasses) => set({ selectedAssetClasses: assetClasses }),
  resetFilters: () => set(defaultFilters),
}));
