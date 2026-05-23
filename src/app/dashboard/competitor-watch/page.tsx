import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { subDays } from "date-fns";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PriceChange {
  competitorName: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  changePct: number;
  recordedAt: Date;
}

async function getCompetitorWatchData(companyId: string) {
  const sevenDaysAgo = subDays(new Date(), 7);

  // Get all competitors tracked by this company with their products and recent prices
  const competitors = await db.competitor.findMany({
    where: {
      companyLinks: { some: { companyId, isTracked: true } },
    },
    include: {
      products: {
        where: { isAvailable: true },
        include: {
          prices: {
            where: { recordedAt: { gte: sevenDaysAgo } },
            orderBy: { recordedAt: "asc" },
          },
        },
      },
    },
  });

  const competitorStats = competitors.map((comp) => {
    let totalChanged = 0;
    let totalChangePct = 0;
    let changedCount = 0;
    let biggestChange: { productName: string; changePct: number } | null = null;

    const allChanges: PriceChange[] = [];

    for (const product of comp.products) {
      const prices = product.prices;
      if (prices.length < 2) continue;

      const firstPrice = prices[0].price;
      const lastPrice = prices[prices.length - 1].price;

      if (Math.abs(lastPrice - firstPrice) > 0.001) {
        totalChanged++;
        const pct = ((lastPrice - firstPrice) / firstPrice) * 100;
        totalChangePct += pct;
        changedCount++;

        if (!biggestChange || Math.abs(pct) > Math.abs(biggestChange.changePct)) {
          biggestChange = { productName: product.name, changePct: pct };
        }

        allChanges.push({
          competitorName: comp.name,
          productName: product.name,
          oldPrice: firstPrice,
          newPrice: lastPrice,
          changePct: pct,
          recordedAt: prices[prices.length - 1].recordedAt,
        });
      }
    }

    const avgChangePct = changedCount > 0 ? totalChangePct / changedCount : 0;
    const trend: "up" | "down" | "neutral" =
      avgChangePct > 1 ? "up" : avgChangePct < -1 ? "down" : "neutral";

    return {
      id: comp.id,
      name: comp.name,
      nameAlbanian: comp.nameAlbanian,
      productCount: comp.products.length,
      changedCount: totalChanged,
      avgChangePct,
      trend,
      biggestChange,
      allChanges,
    };
  });

  // Collect all individual price changes for the bottom table, sorted by abs change desc
  const allChanges: PriceChange[] = competitorStats
    .flatMap((c) => c.allChanges)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 20);

  return { competitorStats, allChanges };
}

function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" }) {
  if (trend === "up")
    return <TrendingUp className="h-5 w-5 text-red-400" />;
  if (trend === "down")
    return <TrendingDown className="h-5 w-5 text-green-400" />;
  return <Minus className="h-5 w-5 text-gray-500" />;
}

export default async function CompetitorWatchPage() {
  const company = await requireCompany();

  if (!company) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Kompania nuk u gjet.</p>
      </div>
    );
  }

  const { competitorStats, allChanges } = await getCompetitorWatchData(company.id);

  return (
    <div className="flex flex-col">
      <Header
        title="Vëzhguesi i Konkurrentëve"
        subtitle="Lëvizjet e çmimeve javë e fundit"
      />

      <div className="p-6 space-y-6">
        {competitorStats.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 text-sm">
                Nuk ka konkurrentë të śladuar. Shto konkurrentë nga paneli i konkurrentëve.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Competitor Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {competitorStats.map((comp) => (
                <Card key={comp.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-base font-semibold text-white">{comp.name}</p>
                        {comp.nameAlbanian && (
                          <p className="text-xs text-gray-500">{comp.nameAlbanian}</p>
                        )}
                      </div>
                      <TrendIcon trend={comp.trend} />
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-gray-800/50 p-2">
                        <p className="text-lg font-bold text-white">{comp.productCount}</p>
                        <p className="text-xs text-gray-500">Produkte</p>
                      </div>
                      <div className="rounded-lg bg-gray-800/50 p-2">
                        <p className="text-lg font-bold text-yellow-400">{comp.changedCount}</p>
                        <p className="text-xs text-gray-500">Ndryshime</p>
                      </div>
                      <div className="rounded-lg bg-gray-800/50 p-2">
                        <p
                          className={`text-lg font-bold ${
                            comp.avgChangePct > 0
                              ? "text-red-400"
                              : comp.avgChangePct < 0
                              ? "text-green-400"
                              : "text-gray-400"
                          }`}
                        >
                          {comp.avgChangePct >= 0 ? "+" : ""}
                          {formatPercent(comp.avgChangePct)}
                        </p>
                        <p className="text-xs text-gray-500">Ndrysh. mes.</p>
                      </div>
                    </div>

                    {comp.biggestChange && (
                      <div className="mt-3 rounded-lg bg-gray-800/30 border border-gray-800 px-3 py-2">
                        <p className="text-xs text-gray-500">Ndryshimi më i madh:</p>
                        <p className="text-xs font-medium text-gray-300 truncate">
                          {comp.biggestChange.productName}
                        </p>
                        <p
                          className={`text-sm font-bold ${
                            comp.biggestChange.changePct > 0
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
                        >
                          {comp.biggestChange.changePct >= 0 ? "+" : ""}
                          {formatPercent(comp.biggestChange.changePct)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Top price changes table */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  Ndryshimet më të mëdha individuale të çmimeve
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {allChanges.length === 0 ? (
                  <p className="text-sm text-gray-500 px-6 pb-6">
                    Nuk ka ndryshime çmimesh gjatë javës së fundit.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                            Konkurrenti
                          </th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                            Produkti
                          </th>
                          <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                            Çmimi i vjetër
                          </th>
                          <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                            Çmimi i ri
                          </th>
                          <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                            Ndryshimi
                          </th>
                          <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                            Kur
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {allChanges.map((change, i) => (
                          <tr
                            key={i}
                            className="hover:bg-gray-800/40 transition-colors"
                          >
                            <td className="px-6 py-3">
                              <span className="font-medium text-gray-200">
                                {change.competitorName}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-[200px]">
                              <span className="text-gray-400 truncate block">
                                {change.productName}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-400">
                              {formatCurrency(change.oldPrice)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-white">
                              {formatCurrency(change.newPrice)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge
                                variant={
                                  change.changePct > 0
                                    ? "danger"
                                    : change.changePct < 0
                                    ? "success"
                                    : "outline"
                                }
                              >
                                {change.changePct >= 0 ? "+" : ""}
                                {formatPercent(change.changePct)}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 text-right text-gray-500 text-xs">
                              {format(change.recordedAt, "dd MMM HH:mm")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
