"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent, categoryLabel } from "@/lib/utils";
import { Flame, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface ProductWithMappings {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  currentPrice: number;
  currentMargin: number;
  cogs: number;
  unitLabel: string | null;
  competitorMappings: Array<{
    competitorProduct: {
      competitor: { name: string };
      prices: Array<{ price: number }>;
    };
  }>;
}

export function PriceHeatmap({ products }: { products: ProductWithMappings[] }) {
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"margin" | "delta">("delta");

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category)))];

  const enriched = products
    .filter((p) => filterCategory === "ALL" || p.category === filterCategory)
    .map((p) => {
      const compPrices = p.competitorMappings
        .flatMap((m) => m.competitorProduct.prices)
        .map((pr) => pr.price)
        .filter(Boolean);

      const compAvg = compPrices.length
        ? compPrices.reduce((a, b) => a + b, 0) / compPrices.length
        : null;

      const priceDeltaPct = compAvg
        ? ((p.currentPrice - compAvg) / compAvg) * 100
        : null;

      return { ...p, compAvg, priceDeltaPct, compPrices };
    })
    .sort((a, b) => {
      if (sortBy === "margin") return a.currentMargin - b.currentMargin;
      const da = a.priceDeltaPct ?? 0;
      const db = b.priceDeltaPct ?? 0;
      return db - da; // most overpriced first
    });

  function getHeatColor(delta: number | null, margin: number): string {
    if (delta === null) return "bg-gray-800 border-gray-700";
    if (delta > 8) return "bg-red-500/20 border-red-500/40";
    if (delta > 3) return "bg-orange-500/15 border-orange-500/30";
    if (delta < -8) return "bg-emerald-500/20 border-emerald-500/40";
    if (delta < -3) return "bg-green-500/15 border-green-500/30";
    if (margin < 4) return "bg-yellow-500/15 border-yellow-500/30";
    return "bg-gray-800 border-gray-700";
  }

  function getDeltaIcon(delta: number | null) {
    if (delta === null) return <Minus className="h-3 w-3 text-gray-500" />;
    if (delta > 3) return <TrendingUp className="h-3 w-3 text-red-400" />;
    if (delta < -3) return <TrendingDown className="h-3 w-3 text-emerald-400" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  }

  const overpriced = enriched.filter((p) => (p.priceDeltaPct ?? 0) > 3).length;
  const underpriced = enriched.filter((p) => (p.priceDeltaPct ?? 0) < -3).length;

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              Hartë Termike e Çmimeve
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Pozicioni juaj ndaj mesatares konkurruese
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {overpriced} mbi çmim
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {underpriced} nën çmim
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filterCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {cat === "ALL" ? "Të gjitha" : categoryLabel(cat)}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {enriched.map((product) => (
            <div
              key={product.id}
              className={`rounded-lg border p-3 transition-all hover:scale-[1.01] cursor-pointer ${getHeatColor(product.priceDeltaPct, product.currentMargin)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{product.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{product.brand ?? categoryLabel(product.category)}</p>
                </div>
                {getDeltaIcon(product.priceDeltaPct)}
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{formatCurrency(product.currentPrice)}</p>
                  <p className="text-[10px] text-gray-500">
                    {formatPercent(product.currentMargin)} marzh
                  </p>
                </div>
                <div className="text-right">
                  {product.compAvg && (
                    <>
                      <p className="text-[10px] text-gray-500">
                        Konk: {formatCurrency(product.compAvg)}
                      </p>
                      <Badge
                        variant={
                          (product.priceDeltaPct ?? 0) > 5
                            ? "danger"
                            : (product.priceDeltaPct ?? 0) < -5
                            ? "success"
                            : "warning"
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {(product.priceDeltaPct ?? 0) > 0 ? "+" : ""}
                        {product.priceDeltaPct?.toFixed(1)}%
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600 border-t border-gray-800 pt-3">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-red-500/30" /> Mbi çmim &gt;8%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-orange-500/20" /> Mbi çmim 3-8%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-gray-700" /> Konkurrues
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-500/20" /> Nën çmim
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
