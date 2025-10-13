import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useFiltersStore } from '@/store/useFiltersStore';
import { REGIONS, ASSET_CLASSES, getAllCountries, OFFICES, DESKS } from '@/lib/mock/seeds';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { X, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export function FiltersPanel() {
  const exposureRange = useFiltersStore((state) => state.exposureRange);
  const exposureDiffRange = useFiltersStore((state) => state.exposureDiffRange);
  const exposureRelToLimitRange = useFiltersStore((state) => state.exposureRelToLimitRange);
  const selectedCountries = useFiltersStore((state) => state.selectedCountries);
  const selectedOffices = useFiltersStore((state) => state.selectedOffices);
  const selectedDesks = useFiltersStore((state) => state.selectedDesks);
  const selectedRegions = useFiltersStore((state) => state.selectedRegions);
  const selectedAssetClasses = useFiltersStore((state) => state.selectedAssetClasses);

  const setExposureRange = useFiltersStore((state) => state.setExposureRange);
  const setExposureDiffRange = useFiltersStore((state) => state.setExposureDiffRange);
  const setExposureRelToLimitRange = useFiltersStore((state) => state.setExposureRelToLimitRange);
  const setSelectedCountries = useFiltersStore((state) => state.setSelectedCountries);
  const setSelectedOffices = useFiltersStore((state) => state.setSelectedOffices);
  const setSelectedDesks = useFiltersStore((state) => state.setSelectedDesks);
  const setSelectedRegions = useFiltersStore((state) => state.setSelectedRegions);
  const setSelectedAssetClasses = useFiltersStore((state) => state.setSelectedAssetClasses);
  const resetFilters = useFiltersStore((state) => state.resetFilters);

  const [tempCountries, setTempCountries] = useState<Set<string>>(new Set(selectedCountries));
  const [tempOffices, setTempOffices] = useState<Set<string>>(new Set(selectedOffices));
  const [tempDesks, setTempDesks] = useState<Set<string>>(new Set(selectedDesks));
  const [tempRegions, setTempRegions] = useState<Set<string>>(new Set(selectedRegions));
  const [tempAssetClasses, setTempAssetClasses] = useState<Set<string>>(new Set(selectedAssetClasses));

  const allCountries = getAllCountries();

  const handleCountryToggle = (country: string) => {
    const newSet = new Set(tempCountries);
    if (newSet.has(country)) {
      newSet.delete(country);
    } else {
      newSet.add(country);
    }
    setTempCountries(newSet);
    setSelectedCountries(Array.from(newSet));
  };

  const handleOfficeToggle = (office: string) => {
    const newSet = new Set(tempOffices);
    if (newSet.has(office)) {
      newSet.delete(office);
    } else {
      newSet.add(office);
    }
    setTempOffices(newSet);
    setSelectedOffices(Array.from(newSet));
  };

  const handleDeskToggle = (desk: string) => {
    const newSet = new Set(tempDesks);
    if (newSet.has(desk)) {
      newSet.delete(desk);
    } else {
      newSet.add(desk);
    }
    setTempDesks(newSet);
    setSelectedDesks(Array.from(newSet));
  };

  const handleRegionToggle = (region: string) => {
    const newSet = new Set(tempRegions);
    if (newSet.has(region)) {
      newSet.delete(region);
    } else {
      newSet.add(region);
    }
    setTempRegions(newSet);
    setSelectedRegions(Array.from(newSet) as any);
  };

  const handleAssetClassToggle = (assetClass: string) => {
    const newSet = new Set(tempAssetClasses);
    if (newSet.has(assetClass)) {
      newSet.delete(assetClass);
    } else {
      newSet.add(assetClass);
    }
    setTempAssetClasses(newSet);
    setSelectedAssetClasses(Array.from(newSet) as any);
  };

  const handleReset = () => {
    resetFilters();
    setTempCountries(new Set());
    setTempOffices(new Set());
    setTempDesks(new Set());
    setTempRegions(new Set());
    setTempAssetClasses(new Set());
  };

  return (
    <Card className="glass-panel p-4 space-y-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Exposure Range</label>
        <Slider
          value={exposureRange}
          onValueChange={setExposureRange}
          min={0}
          max={1000000000}
          step={10000000}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(exposureRange[0], 0)}</span>
          <span>{formatCurrency(exposureRange[1], 0)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Exposure Diff Range</label>
        <Slider
          value={exposureDiffRange}
          onValueChange={setExposureDiffRange}
          min={-100000000}
          max={100000000}
          step={5000000}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(exposureDiffRange[0], 0)}</span>
          <span>{formatCurrency(exposureDiffRange[1], 0)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Exposure Rel to Limit</label>
        <Slider
          value={exposureRelToLimitRange}
          onValueChange={setExposureRelToLimitRange}
          min={0}
          max={1}
          step={0.01}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatPercent(exposureRelToLimitRange[0])}</span>
          <span>{formatPercent(exposureRelToLimitRange[1])}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Regions</label>
        <div className="flex flex-wrap gap-2">
          {REGIONS.filter((r) => r !== 'Global').map((region) => (
            <Badge
              key={region}
              variant={tempRegions.has(region) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleRegionToggle(region)}
            >
              {region}
              {tempRegions.has(region) && <X className="h-3 w-3 ml-1" />}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Asset Classes</label>
        <div className="flex flex-wrap gap-2">
          {ASSET_CLASSES.map((ac) => (
            <Badge
              key={ac}
              variant={tempAssetClasses.has(ac) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleAssetClassToggle(ac)}
            >
              {ac}
              {tempAssetClasses.has(ac) && <X className="h-3 w-3 ml-1" />}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Countries ({tempCountries.size} selected)</label>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {allCountries.map((country) => (
            <div
              key={country}
              className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
              onClick={() => handleCountryToggle(country)}
            >
              <input
                type="checkbox"
                checked={tempCountries.has(country)}
                onChange={() => {}}
                className="rounded"
              />
              <span className="text-sm">{country}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Offices ({tempOffices.size} selected)</label>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {OFFICES.map((office) => (
            <div
              key={office}
              className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
              onClick={() => handleOfficeToggle(office)}
            >
              <input
                type="checkbox"
                checked={tempOffices.has(office)}
                onChange={() => {}}
                className="rounded"
              />
              <span className="text-sm">{office}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Desks ({tempDesks.size} selected)</label>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {DESKS.map((desk) => (
            <div
              key={desk}
              className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
              onClick={() => handleDeskToggle(desk)}
            >
              <input
                type="checkbox"
                checked={tempDesks.has(desk)}
                onChange={() => {}}
                className="rounded"
              />
              <span className="text-sm">{desk}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
