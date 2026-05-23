import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarginWaterfallChart, WaterfallStep } from "@/components/dashboard/margin-waterfall-chart";
import { formatCurrency, formatPercent, categoryLabel, getMarginColor } from "@/lib/utils";

const ESTIMATE_UNITS = 1000;
const OPERATING_COST_PCT = 0.15; // 15% of revenue

async function getWaterfallData(companyId: string) {
  const products = await db.product.findMany({
    where: { companyId, isActive: true },
    select: {
      category: true,
      currentPrice: true,
      cogs: true,
      currentMargin: true,
    },
  });

  if (products.length === 0) return null;

  // Aggregate totals (estimated using ESTIMATE_UNITS per product)
  let totalRevenue = 0;
  let totalCogs = 0;

  const categoryMap: Record<
    string,
    { revenue: number; cogs: number; grossMargin: number; productCount: number }
  > = {};

  for (const p of products) {
    const revenue = p.currentPrice * ESTIMATE_UNITS;
    const cogs = p.cogs * ESTIMATE_UNITS;
    const grossMargin = revenue - cogs;

    totalRevenue += revenue;
    totalCogs += cogs;

    if (!categoryMap[p.category]) {
      categoryMap[p.category] = { revenue: 0, cogs: 0, grossMargin: 0, productCount: 0 };
    }
    categoryMap[p.category].revenue += revenue;
    categoryMap[p.category].cogs += cogs;
    categoryMap[p.category].grossMargin += grossMargin;
    categoryMap[p.category].productCount++;
  }

  const grossMargin = totalRevenue - totalCogs;
  const operatingCosts = totalRevenue * OPERATING_COST_PCT;
  const netMargin = grossMargin - operatingCosts;

  const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
  const netMarginPct = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0;

  // Build waterfall steps
  const steps: WaterfallStep[] = [
    {
      name: "Të ardhura",
      value: totalRevenue,
      start: 0,
      isTotal: true,
      color: "#3b82f6",
    },
    {
      name: "COGS",
      value: -totalCogs,
      start: totalRevenue,
      isTotal: false,
      color: "#ef4444",
    },
    {
      name: "Marzhi bruto",
      value: grossMargin,
      start: 0,
      isTotal: true,
      color: "#22c55e",
    },
    {
      name: "Kosto operative",
      value: -operatingCosts,
      start: grossMargin,
      isTotal: false,
      color: "#f59e0b",
    },
    {
      name: "Marzhi neto",
      value: netMargin,
      start: 0,
      isTotal: true,
      color: "#10b981",
    },
  ];

  // Category breakdown sorted by gross margin desc
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([cat, data]) => ({
      category: cat,
      label: categoryLabel(cat),
      revenue: data.revenue,
      cogs: data.cogs,
      grossMargin: data.grossMargin,
      grossMarginPct: data.revenue > 0 ? (data.grossMargin / data.revenue) * 100 : 0,
      productCount: data.productCount,
      contributionPct: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.grossMargin - a.grossMargin);

  return {
    totalRevenue,
    totalCogs,
    grossMargin,
    grossMarginPct,
    operatingCosts,
    netMargin,
    netMarginPct,
    steps,
    categoryBreakdown,
    productCount: products.length,
  };
}

export default async function WaterfallPage() {
  const company = await requireCompany();

  if (!company) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Kompania nuk u gjet.</p>
      </div>
    );
  }

  const data = await getWaterfallData(company.id);

  if (!data) {
    return (
      <div className="flex flex-col">
        <Header
          title="Analiza Waterfall e Marzhit"
          subtitle="Nga të ardhurat bruto te marzhi neto"
        />
        <div className="p-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 text-sm">
                Nuk ka produkte aktive për të llogaritur analizën waterfall.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Analiza Waterfall e Marzhit"
        subtitle="Nga të ardhurat bruto te marzhi neto"
      />

      <div className="p-6 space-y-6">
        {/* Summary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500">Të ardhura totale (est.)</p>
              <p className="text-xl font-bold text-blue-400 mt-1">
                {formatCurrency(data.totalRevenue)}
              </p>
              <p className="text-xs text-gray-600 mt-1">{data.productCount} produkte × {ESTIMATE_UNITS} njësi</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500">COGS total</p>
              <p className="text-xl font-bold text-red-400 mt-1">
                {formatCurrency(data.totalCogs)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500">Marzhi bruto</p>
              <p className={`text-xl font-bold mt-1 ${getMarginColor(data.grossMarginPct)}`}>
                {formatPercent(data.grossMarginPct)}
              </p>
              <p className="text-xs text-gray-600 mt-1">{formatCurrency(data.grossMargin)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500">Marzhi neto (est.)</p>
              <p className={`text-xl font-bold mt-1 ${getMarginColor(data.netMarginPct)}`}>
                {formatPercent(data.netMarginPct)}
              </p>
              <p className="text-xs text-gray-600 mt-1">{formatCurrency(data.netMargin)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Waterfall chart */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">
              Grafiku Waterfall i Marzhit
            </CardTitle>
            <p className="text-xs text-gray-500">
              Vlerësim bazuar në {data.productCount} produkte × {ESTIMATE_UNITS} njësi/produkt •
              Kostot operative = {formatPercent(OPERATING_COST_PCT * 100, 0)} e të ardhurave
            </p>
          </CardHeader>
          <CardContent>
            <MarginWaterfallChart steps={data.steps} />
          </CardContent>
        </Card>

        {/* Category contribution table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">
              Kontributi i kategorive në marzh total
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                      Kategoria
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                      Produkte
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                      Të ardhura (est.)
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                      Marzhi bruto
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                      Marzhi %
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                      Kontributi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {data.categoryBreakdown.map((cat) => (
                    <tr key={cat.category} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-200">{cat.label}</td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {cat.productCount}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {formatCurrency(cat.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${cat.grossMargin >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {formatCurrency(cat.grossMargin)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${getMarginColor(cat.grossMarginPct)}`}>
                          {formatPercent(cat.grossMarginPct)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 bg-gray-800 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, cat.contributionPct)}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-xs w-10 text-right">
                            {formatPercent(cat.contributionPct, 0)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
