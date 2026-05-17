"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent, categoryLabel } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell,
} from "recharts";
import { TrendingUp, Euro, Target, BarChart3 } from "lucide-react";

interface AnalyticsData {
  categoryStats: Array<{
    category: string;
    _avg: { currentMargin: number | null; currentPrice: number | null };
    _count: { id: number };
  }>;
  regionStats: Array<{ name: string; region: string; city: string }>;
  competitorComparison: Array<{
    name: string;
    pricingStrategy: string | null;
    avgPrice: number;
    productCount: number;
  }>;
  appliedRevenue: number;
  appliedCount: number;
}

const CATEGORY_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1",
];

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const categoryChartData = data.categoryStats
    .filter((c) => c._avg.currentMargin !== null)
    .map((c) => ({
      category: categoryLabel(c.category).slice(0, 12),
      marzhi: parseFloat((c._avg.currentMargin ?? 0).toFixed(1)),
      produktet: c._count.id,
    }))
    .sort((a, b) => b.marzhi - a.marzhi);

  const competitorChartData = data.competitorComparison
    .filter((c) => c.avgPrice > 0)
    .map((c) => ({
      name: c.name.split(" ")[0],
      avgPrice: parseFloat(c.avgPrice.toFixed(2)),
      strategy: c.pricingStrategy ?? "—",
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs shadow-xl">
          <p className="text-gray-400 mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} className="font-semibold" style={{ color: p.color }}>
              {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
              {p.name === "marzhi" ? "%" : p.name === "avgPrice" ? "€" : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Euro className="h-5 w-5 text-emerald-400" />
              <span className="text-xs text-gray-500">Revenue i Optimizuar</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(data.appliedRevenue)}
            </p>
            <p className="text-xs text-gray-600 mt-1">nga rekomandimet e zbatuara</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-blue-400" />
              <span className="text-xs text-gray-500">Rekomandime të Zbatuara</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{data.appliedCount}</p>
            <p className="text-xs text-gray-600 mt-1">çmime të ndryshuara</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <span className="text-xs text-gray-500">Kategori të Analizuara</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{data.categoryStats.length}</p>
            <p className="text-xs text-gray-600 mt-1">kategori produktesh</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              <span className="text-xs text-gray-500">Konkurrentë Aktiv</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">
              {data.competitorComparison.length}
            </p>
            <p className="text-xs text-gray-600 mt-1">zinxhirë nën monitorim</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category margin chart */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">
              Marzhi Mesatar sipas Kategorisë
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={categoryChartData}
                layout="vertical"
                margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 35]}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="marzhi" radius={[0, 4, 4, 0]}>
                  {categoryChartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Competitor avg price */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">
              Çmimi Mesatar i Konkurrentëve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={competitorChartData} margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `€${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgPrice" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {competitorChartData.map((_, index) => (
                    <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Performanca sipas Kategorisë</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500">
                  <th className="py-2 text-left font-medium">Kategoria</th>
                  <th className="py-2 text-right font-medium">Produkte</th>
                  <th className="py-2 text-right font-medium">Marzhi Mesatar</th>
                  <th className="py-2 text-right font-medium">Çmimi Mesatar</th>
                  <th className="py-2 text-right font-medium">Vlerësimi</th>
                </tr>
              </thead>
              <tbody>
                {data.categoryStats
                  .sort((a, b) => (b._avg.currentMargin ?? 0) - (a._avg.currentMargin ?? 0))
                  .map((cat) => {
                    const margin = cat._avg.currentMargin ?? 0;
                    const assessment =
                      margin >= 15
                        ? { label: "Shkëlqyer", variant: "success" as const }
                        : margin >= 8
                        ? { label: "Mirë", variant: "info" as const }
                        : margin >= 4
                        ? { label: "Mesatar", variant: "warning" as const }
                        : { label: "I ulët", variant: "danger" as const };

                    return (
                      <tr key={cat.category} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                        <td className="py-3 font-medium text-white">{categoryLabel(cat.category)}</td>
                        <td className="py-3 text-right text-gray-400">{cat._count.id}</td>
                        <td className="py-3 text-right font-semibold text-white">
                          {formatPercent(margin)}
                        </td>
                        <td className="py-3 text-right text-gray-400">
                          {cat._avg.currentPrice ? formatCurrency(cat._avg.currentPrice) : "—"}
                        </td>
                        <td className="py-3 text-right">
                          <Badge variant={assessment.variant} className="text-xs">
                            {assessment.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
