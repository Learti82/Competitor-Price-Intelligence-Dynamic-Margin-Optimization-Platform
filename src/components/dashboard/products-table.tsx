"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatPercent, categoryLabel, getMarginColor } from "@/lib/utils";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  category: string;
  unitLabel: string | null;
  cogs: number;
  currentPrice: number;
  currentMargin: number;
  recommendations: Array<{
    recommendedMargin: number;
    recommendedPrice: number;
    confidenceScore: number;
  }>;
  competitorMappings: Array<{
    competitorProduct: {
      competitor: { name: string; slug: string };
      prices: Array<{ price: number }>;
    };
  }>;
}

export function ProductsTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "ALL" || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Kërko SKU, emër, markë..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-gray-800 border-gray-700 text-gray-300"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-700 text-gray-300">
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="ALL">Të gjitha kategoritë</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {categoryLabel(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-gray-500">
          {filtered.length} produkte • Klikoni kolonën për renditje
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="px-4 py-3 text-left font-medium">Produkt</th>
                <th className="px-4 py-3 text-left font-medium">Kategori</th>
                <th className="px-4 py-3 text-right font-medium">Kosto</th>
                <th className="px-4 py-3 text-right font-medium">Çmimi Juaj</th>
                <th className="px-4 py-3 text-right font-medium">Marzhi</th>
                <th className="px-4 py-3 text-right font-medium">Çmimi Avg Konk.</th>
                <th className="px-4 py-3 text-right font-medium">Delta %</th>
                <th className="px-4 py-3 text-right font-medium">Rek. AI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const compPrices = product.competitorMappings
                  .flatMap((m) => m.competitorProduct.prices)
                  .map((p) => p.price);
                const compAvg = compPrices.length
                  ? compPrices.reduce((a, b) => a + b, 0) / compPrices.length
                  : null;
                const delta = compAvg
                  ? ((product.currentPrice - compAvg) / compAvg) * 100
                  : null;
                const rec = product.recommendations[0];

                return (
                  <tr
                    key={product.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          {product.brand && `${product.brand} • `}
                          <span className="font-mono">{product.sku}</span>
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-400">
                        {categoryLabel(product.category)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {formatCurrency(product.cogs)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      {formatCurrency(product.currentPrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${getMarginColor(product.currentMargin)}`}>
                        {formatPercent(product.currentMargin)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {compAvg ? formatCurrency(compAvg) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {delta !== null ? (
                        <div className="flex items-center justify-end gap-1">
                          {delta > 3 ? (
                            <TrendingUp className="h-3 w-3 text-red-400" />
                          ) : delta < -3 ? (
                            <TrendingDown className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Minus className="h-3 w-3 text-gray-500" />
                          )}
                          <span
                            className={
                              delta > 3
                                ? "text-red-400"
                                : delta < -3
                                ? "text-emerald-400"
                                : "text-gray-400"
                            }
                          >
                            {delta > 0 ? "+" : ""}
                            {delta.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {rec ? (
                        <div className="text-right">
                          <span
                            className={
                              rec.recommendedMargin > product.currentMargin
                                ? "text-emerald-400"
                                : "text-yellow-400"
                            }
                          >
                            {formatPercent(rec.recommendedMargin)}
                          </span>
                          <p className="text-[10px] text-gray-600">
                            {rec.confidenceScore.toFixed(0)}% besim
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
