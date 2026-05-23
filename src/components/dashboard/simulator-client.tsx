"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent, calcMargin, getMarginColor } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SimProduct {
  id: string;
  name: string;
  sku: string;
  currentPrice: number;
  cogs: number;
  currentMargin: number;
}

interface SimulatorClientProps {
  products: SimProduct[];
}

export function SimulatorClient({ products }: SimulatorClientProps) {
  const [selectedId, setSelectedId] = useState<string>(products[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [dailyVolume, setDailyVolume] = useState(100);
  const [elasticity, setElasticity] = useState(-1.2);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const product = products.find((p) => p.id === selectedId) ?? products[0];

  const effectiveNewPrice = newPrice ?? product?.currentPrice ?? 0;

  const sim = useMemo(() => {
    if (!product) return null;

    const cp = product.currentPrice;
    const cogs = product.cogs;
    const np = effectiveNewPrice;

    const priceChangePct = cp > 0 ? ((np - cp) / cp) * 100 : 0;
    const newMargin = calcMargin(np, cogs);
    const revenueChangePDay = dailyVolume * (np - cp);
    const newVolume = dailyVolume * (1 + elasticity * (priceChangePct / 100));
    const adjustedRevenue = newVolume * np;
    const currentRevenue = dailyVolume * cp;
    const monthlyImpact = (adjustedRevenue - currentRevenue) * 30;

    return {
      priceChangePct,
      newMargin,
      revenueChangePDay,
      newVolume: Math.max(0, newVolume),
      adjustedRevenue,
      currentRevenue,
      monthlyImpact,
    };
  }, [product, effectiveNewPrice, dailyVolume, elasticity]);

  const chartData = sim
    ? [
        {
          name: "Aktualisht",
          "Të ardhura (€)": Math.round(sim.currentRevenue),
          "Marzhi (%)": Math.round(product?.currentMargin ?? 0),
        },
        {
          name: "Simuluar",
          "Të ardhura (€)": Math.round(sim.adjustedRevenue),
          "Marzhi (%)": Math.round(sim.newMargin),
        },
      ]
    : [];

  function handleProductSelect(id: string) {
    const p = products.find((pr) => pr.id === id);
    setSelectedId(id);
    setNewPrice(p?.currentPrice ?? null);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left panel */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Konfiguro simulimin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Product selector */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium">Zgjedh produktin</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kërko produkt ose SKU..."
                className="w-full rounded-md bg-gray-800 border border-gray-700 text-sm text-gray-200 px-3 py-2 placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
              />
              <select
                value={selectedId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full rounded-md bg-gray-800 border border-gray-700 text-sm text-gray-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                size={5}
              >
                {filtered.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.sku}
                  </option>
                ))}
              </select>
            </div>

            {product && (
              <>
                {/* Current price display */}
                <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Çmimi aktual</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(product.currentPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">COGS</p>
                    <p className="text-sm font-semibold text-gray-300">
                      {formatCurrency(product.cogs)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Marzhi</p>
                    <p className={`text-sm font-semibold ${getMarginColor(product.currentMargin)}`}>
                      {formatPercent(product.currentMargin)}
                    </p>
                  </div>
                </div>

                {/* New price slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-400 font-medium">Çmimi i ri</label>
                    <span className="text-sm font-bold text-blue-400">
                      {formatCurrency(effectiveNewPrice)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={product.currentPrice * 0.7}
                    max={product.currentPrice * 1.5}
                    step={0.01}
                    value={effectiveNewPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{formatCurrency(product.currentPrice * 0.7)}</span>
                    <span>{formatCurrency(product.currentPrice * 1.5)}</span>
                  </div>
                </div>

                {/* Daily volume */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-400 font-medium">
                      Volumi ditor i shitjeve
                    </label>
                    <span className="text-sm font-bold text-gray-300">{dailyVolume} njësi</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={dailyVolume}
                    onChange={(e) => setDailyVolume(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-sm text-gray-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Elasticity slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-400 font-medium">Elasticiteti i çmimit</label>
                    <span className="text-sm font-bold text-gray-300">{elasticity.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={-3}
                    max={-0.5}
                    step={0.1}
                    value={elasticity}
                    onChange={(e) => setElasticity(parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>-3.0 (shumë elastik)</span>
                    <span>-0.5 (pak elastik)</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right panel */}
        {sim && product && (
          <div className="space-y-4">
            {/* New margin */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Marzhi i ri</p>
                    <p className={`text-4xl font-bold mt-1 ${getMarginColor(sim.newMargin)}`}>
                      {formatPercent(sim.newMargin)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Aktual: {formatPercent(product.currentMargin)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Ndryshimi i çmimit</p>
                    <p
                      className={`text-xl font-bold mt-1 ${
                        sim.priceChangePct >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {sim.priceChangePct >= 0 ? "+" : ""}
                      {formatPercent(sim.priceChangePct)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-gray-500">Ndryshimi i të ardhurave/ditë</p>
                  <p
                    className={`text-xl font-bold mt-1 ${
                      sim.revenueChangePDay >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {sim.revenueChangePDay >= 0 ? "+" : ""}
                    {formatCurrency(sim.revenueChangePDay)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-gray-500">Volumi i parashikuar/ditë</p>
                  <p className="text-xl font-bold mt-1 text-white">
                    {Math.round(sim.newVolume)} njësi
                  </p>
                  <p className="text-xs text-gray-600">
                    Aktual: {dailyVolume} njësi
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-gray-500">Të ardhura ditore (simuluar)</p>
                  <p className="text-xl font-bold mt-1 text-white">
                    {formatCurrency(sim.adjustedRevenue)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Aktual: {formatCurrency(sim.currentRevenue)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-gray-500">Ndikimi mujor</p>
                  <p
                    className={`text-xl font-bold mt-1 ${
                      sim.monthlyImpact >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {sim.monthlyImpact >= 0 ? "+" : ""}
                    {formatCurrency(sim.monthlyImpact)}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-xs mt-1 ${
                      sim.monthlyImpact >= 0
                        ? "border-green-700 text-green-400"
                        : "border-red-700 text-red-400"
                    }`}
                  >
                    {sim.monthlyImpact >= 0 ? "Fitim" : "Humbje"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Comparison chart */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Krahasim: Aktualisht vs Simuluar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="revenue"
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `€${v}`}
                    />
                    <YAxis
                      yAxisId="margin"
                      orientation="right"
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
                    <Bar
                      yAxisId="revenue"
                      dataKey="Të ardhura (€)"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="margin"
                      dataKey="Marzhi (%)"
                      fill="#a855f7"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
