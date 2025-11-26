"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Company {
  ticker: string;
  shares: number;
  marketValue?: number;
  priceToday?: number;
  priceYesterday?: number;
}

export default function HealthcareList() {
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTicker, setNewTicker] = useState("");
  const [newShares, setNewShares] = useState(1);
  const [updating, setUpdating] = useState(false);
  const [totalMarketValue, setTotalMarketValue] = useState(0);

  // Fetch portfolio from backend
  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/health/companies");
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();

      const companies: Company[] = (data.companies || data).map((c: any) => ({
        ticker: c.ticker,
        shares: c.shares,
        marketValue: c.marketValue,
        priceToday: c.priceToday,
        priceYesterday: c.priceYesterday,
      }));

      setCompanyList(companies);
      setTotalMarketValue(data.totalMarketValue || 0);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch portfolio");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Add new company
  const handleAdd = async () => {
    if (!newTicker) return;

    const payload = {
      ticker: newTicker.toUpperCase(),
      sector: "Other",
      shares: newShares,
    };

    try {
      setUpdating(true);
      const res = await fetch("http://localhost:8000/api/health/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetchPortfolio(); 

      if (!res.ok) throw new Error("Failed to add company");

      const added = await res.json();
      // Optimistically update frontend
      setCompanyList(prev => [...prev, {
        ticker: added.company.ticker,
        shares: added.company.shares,
        marketValue: added.company.marketValue,
        priceToday: added.company.priceToday,
        priceYesterday: added.company.priceYesterday
      }]);

      setNewTicker("");
      setNewShares(1);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Remove company
  const removeTicker = async (ticker: string) => {
    try {
      setCompanyList(prev => prev.filter(c => c.ticker !== ticker)); // Optimistic
      await fetch(`http://localhost:8000/api/health/remove/${ticker}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error(err);
      await fetchPortfolio(); // fallback to refresh
    }
  };

  // Save all updated shares in one batch
  const handleSaveChanges = async () => {
    const payload = companyList.map(c => ({
      ticker: c.ticker,
      shares: c.shares,
    }));

    try {
      setUpdating(true);
      await fetch("http://localhost:8000/api/health/update-shares", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetchPortfolio(); // refresh to get updated marketValue, etc.
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Skeleton className="w-full h-[400px]" />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="glass-panel p-6">
        <h2 className="text-2xl font-semibold mb-4">Tech Portfolio Companies</h2>

        <div className="space-y-2">
          {companyList.length === 0 && (
            <p className="text-sm text-muted-foreground">No companies added.</p>
          )}

          {companyList.map((c) => (
            <div
              key={c.ticker}
              className="flex items-center justify-between gap-4 border rounded p-2"
            >
              <div className="flex flex-col md:flex-row items-center gap-4">
                <span className="font-semibold">{c.ticker}</span>

                {/* Share Incrementer */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setCompanyList(prev =>
                        prev.map(item =>
                          item.ticker === c.ticker
                            ? { ...item, shares: Math.max(0, item.shares - 1) }
                            : item
                        )
                      );
                    }}
                  >
                    -
                  </Button>

                  <span className="w-10 text-center font-medium">
                    {c.shares}
                  </span>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setCompanyList(prev =>
                        prev.map(item =>
                          item.ticker === c.ticker
                            ? { ...item, shares: item.shares + 1 }
                            : item
                        )
                      );
                    }}
                  >
                    +
                  </Button>
                </div>

                <span className="text-sm text-muted-foreground">
                  {c.marketValue !== undefined
                    ? formatCurrency(c.marketValue, 0)
                    : "-"}
                </span>
              </div>

              <button
                onClick={() => removeTicker(c.ticker)}
                className="p-2 rounded hover:bg-red-50"
                title="Remove"
              >
                <Trash className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>

        {/* Save Changes Button */}
        <div className="pt-4">
          <Button
            onClick={handleSaveChanges}
            disabled={updating}
            className="w-full"
          >
            {updating ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Add New Ticker */}
        <div className="pt-4 border-t flex flex-col md:flex-row gap-2 md:items-center md:gap-4">
          <input
            type="text"
            placeholder="Ticker (e.g. NVDA)"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value)}
            className="border rounded px-2 py-1 flex-1"
          />
          <input
            type="number"
            min={1}
            value={newShares}
            onChange={(e) => setNewShares(Number(e.target.value))}
            className="w-24 border rounded px-2 py-1"
          />
          <Button
            onClick={handleAdd}
            disabled={!newTicker || updating}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </Card>

      <Card className="glass-panel p-6">
        <h2 className="text-xl font-semibold">Total Tech Investment</h2>
        <p className="text-2xl font-bold mt-2">
          {formatCurrency(totalMarketValue, 0)}
        </p>
      </Card>
    </div>
  );
}
