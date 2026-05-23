import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryMarginChart } from "@/components/dashboard/category-margin-chart";
import { formatPercent, categoryLabel, getMarginColor } from "@/lib/utils";

async function getCategoryStats(companyId: string) {
  const products = await db.product.findMany({
    where: { companyId, isActive: true },
    select: {
      category: true,
      currentMargin: true,
      recommendations: {
        where: { status: "PENDING" },
        select: { id: true },
      },
    },
  });

  const categoryMap: Record<
    string,
    {
      margins: number[];
      pendingRecs: number;
    }
  > = {};

  for (const p of products) {
    if (!categoryMap[p.category]) {
      categoryMap[p.category] = { margins: [], pendingRecs: 0 };
    }
    categoryMap[p.category].margins.push(p.currentMargin);
    categoryMap[p.category].pendingRecs += p.recommendations.length;
  }

  return Object.entries(categoryMap).map(([category, data]) => {
    const margins = data.margins;
    const avg = margins.reduce((a, b) => a + b, 0) / margins.length;
    const min = Math.min(...margins);
    const max = Math.max(...margins);

    return {
      category,
      label: categoryLabel(category),
      productCount: margins.length,
      avgMargin: avg,
      minMargin: min,
      maxMargin: max,
      pendingRecs: data.pendingRecs,
    };
  });
}

function getTrendBadge(avgMargin: number) {
  if (avgMargin >= 15)
    return (
      <Badge variant="success">Shkëlqyeshëm</Badge>
    );
  if (avgMargin >= 8)
    return <Badge variant="info">Mirë</Badge>;
  if (avgMargin >= 3)
    return <Badge variant="warning">Mesatar</Badge>;
  return <Badge variant="danger">I ulët</Badge>;
}

export default async function CategoryStatsPage() {
  const company = await requireCompany();

  if (!company) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Kompania nuk u gjet.</p>
      </div>
    );
  }

  const stats = await getCategoryStats(company.id);
  const sorted = [...stats].sort((a, b) => b.avgMargin - a.avgMargin);

  const chartData = sorted.map((s) => ({
    category: s.category,
    label: s.label,
    avgMargin: parseFloat(s.avgMargin.toFixed(2)),
  }));

  return (
    <div className="flex flex-col">
      <Header
        title="Rentabiliteti i Kategorive"
        subtitle="Krahasim i marzhit sipas kategorisë"
      />

      <div className="p-6 space-y-6">
        {stats.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 text-sm">
                Nuk ka produkte aktive me kategori të caktuara.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Bar chart */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  Marzhi mesatar sipas kategorisë
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryMarginChart data={chartData} />
              </CardContent>
            </Card>

            {/* Detail table */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  Detaje sipas kategorisë
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
                          Marzhi mes.
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                          Min
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                          Max
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                          Rek. në pritje
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                          Vlerësim
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {sorted.map((cat) => (
                        <tr
                          key={cat.category}
                          className="hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="px-6 py-3 font-medium text-gray-200">
                            {cat.label}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-400">
                            {cat.productCount}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`font-bold ${getMarginColor(cat.avgMargin)}`}
                            >
                              {formatPercent(cat.avgMargin)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-red-400">
                            {formatPercent(cat.minMargin)}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-400">
                            {formatPercent(cat.maxMargin)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {cat.pendingRecs > 0 ? (
                              <Badge variant="warning">{cat.pendingRecs}</Badge>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {getTrendBadge(cat.avgMargin)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
