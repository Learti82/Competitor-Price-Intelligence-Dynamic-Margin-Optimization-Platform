import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent, categoryLabel } from "@/lib/utils";
import { FilterBar } from "./filter-bar";
import { TrendingDown, TrendingUp, Minus, Package, BarChart3, Target, Flame } from "lucide-react";
import { subDays } from "date-fns";

interface PageProps {
  searchParams: Promise<{ category?: string; opportunities?: string }>;
}

export default async function CompetitorPricesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedCategory = params.category;
  const opportunitiesOnly = params.opportunities === "1";

  const company = await requireCompany();
  if (!company) {
    return (
      <div className="flex flex-col">
        <Header
          title="Çmimet Live të Konkurrentëve"
          subtitle="Krahaso çmimet tona me konkurrentët • E gjeshme = jemi nën tregun (mund të rrisim çmimin) • Mesatar = jemi në linjë me tregun"
        />
        <div className="p-6 text-sm text-gray-400">Nuk u gjet kompania juaj.</div>
      </div>
    );
  }

  const sevenDaysAgo = subDays(new Date(), 7);

  const [products, recentPriceChanges] = await Promise.all([
    db.product.findMany({
      where: { companyId: company.id, isActive: true },
      include: {
        competitorMappings: {
          include: {
            competitorProduct: {
              include: {
                competitor: { select: { name: true, slug: true, pricingStrategy: true } },
                prices: { orderBy: { recordedAt: "desc" }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    // Get competitor products with significant price changes in last 7 days
    db.competitorProduct.findMany({
      where: {
        competitor: { companyLinks: { some: { companyId: company.id } } },
        prices: { some: { recordedAt: { gte: sevenDaysAgo } } },
      },
      include: {
        competitor: { select: { name: true, slug: true } },
        prices: {
          orderBy: { recordedAt: "desc" },
          take: 8,
        },
        mappings: {
          include: { product: { select: { name: true } } },
          take: 1,
        },
      },
      take: 100,
    }),
  ]);

  // Build the deduped set of competitors across all products
  const competitorSet = new Map<string, { name: string; slug: string }>();
  for (const p of products) {
    for (const m of p.competitorMappings) {
      const c = m.competitorProduct.competitor;
      if (!competitorSet.has(c.slug)) competitorSet.set(c.slug, { name: c.name, slug: c.slug });
    }
  }
  const competitorList = Array.from(competitorSet.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Build per-product computed data
  type Row = {
    id: string;
    name: string;
    brand: string | null;
    sku: string;
    category: string;
    ourPrice: number;
    competitorPrices: Map<string, number | null>;
    marketAvg: number | null;
    position: "CHEAPEST" | "MIDPACK" | "MOST_EXPENSIVE" | "NO_DATA";
    isOpportunity: boolean; // We are 5%+ cheaper than market avg (= room to raise)
    gapPct: number | null; // (ourPrice - marketAvg)/marketAvg * 100
  };

  const rows: Row[] = products.map((p) => {
    const competitorPrices = new Map<string, number | null>();
    const numericPrices: number[] = [];
    for (const c of competitorList) competitorPrices.set(c.slug, null);
    for (const m of p.competitorMappings) {
      const slug = m.competitorProduct.competitor.slug;
      const latest = m.competitorProduct.prices[0]?.price ?? null;
      competitorPrices.set(slug, latest);
      if (latest !== null) numericPrices.push(latest);
    }
    const marketAvg = numericPrices.length
      ? numericPrices.reduce((a, b) => a + b, 0) / numericPrices.length
      : null;
    const gapPct = marketAvg ? ((p.currentPrice - marketAvg) / marketAvg) * 100 : null;

    let position: Row["position"] = "NO_DATA";
    if (numericPrices.length > 0) {
      const allPrices = [p.currentPrice, ...numericPrices].sort((a, b) => a - b);
      if (p.currentPrice <= allPrices[0] + 0.001) position = "CHEAPEST";
      else if (p.currentPrice >= allPrices[allPrices.length - 1] - 0.001) position = "MOST_EXPENSIVE";
      else position = "MIDPACK";
    }

    const isOpportunity = gapPct !== null && gapPct <= -5;

    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      sku: p.sku,
      category: p.category,
      ourPrice: p.currentPrice,
      competitorPrices,
      marketAvg,
      position,
      isOpportunity,
      gapPct,
    };
  });

  // Filtering
  const categories = Array.from(new Set(products.map((p) => p.category))).sort();
  let filtered = rows;
  if (selectedCategory) filtered = filtered.filter((r) => r.category === selectedCategory);
  if (opportunitiesOnly) filtered = filtered.filter((r) => r.isOpportunity);

  // Stats (across all products, not filtered)
  const totalProducts = rows.length;
  const totalPricePoints = rows.reduce(
    (acc, r) => acc + Array.from(r.competitorPrices.values()).filter((v) => v !== null).length,
    0
  );
  const gapValues = rows.map((r) => r.gapPct).filter((g): g is number => g !== null);
  const avgGap = gapValues.length ? gapValues.reduce((a, b) => a + b, 0) / gapValues.length : 0;

  // Market movers: competitor products with largest price changes this week
  type Mover = {
    productName: string;
    ourProductName: string | null;
    competitorName: string;
    oldPrice: number;
    newPrice: number;
    changePct: number;
  };
  const movers: Mover[] = [];
  for (const cp of recentPriceChanges) {
    const sorted = [...cp.prices].sort(
      (a, b) => b.recordedAt.getTime() - a.recordedAt.getTime()
    );
    if (sorted.length < 2) continue;
    const newest = sorted[0].price;
    const oldest = sorted[sorted.length - 1].price;
    if (oldest === 0) continue;
    const changePct = ((newest - oldest) / oldest) * 100;
    if (Math.abs(changePct) < 1.5) continue;
    movers.push({
      productName: cp.name,
      ourProductName: cp.mappings[0]?.product?.name ?? null,
      competitorName: cp.competitor.name,
      oldPrice: oldest,
      newPrice: newest,
      changePct,
    });
  }
  movers.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  const topMovers = movers.slice(0, 6);

  return (
    <div className="flex flex-col">
      <Header
        title="Çmimet Live të Konkurrentëve"
        subtitle="Krahaso çmimet tona me konkurrentët • E gjeshme = jemi nën tregun (mund të rrisim çmimin) • Mesatar = jemi në linjë me tregun"
      />
      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Package className="h-4 w-4 text-blue-400" />}
            label="Produkte të Monitoruara"
            value={totalProducts.toString()}
          />
          <StatCard
            icon={<BarChart3 className="h-4 w-4 text-purple-400" />}
            label="Pika Çmimi Konkurrentësh"
            value={totalPricePoints.toString()}
          />
          <StatCard
            icon={<Target className="h-4 w-4 text-emerald-400" />}
            label="Boshllëku Mes. (Ne vs Tregu)"
            value={`${avgGap >= 0 ? "+" : ""}${formatPercent(avgGap)}`}
            valueClass={avgGap > 1 ? "text-red-400" : avgGap < -1 ? "text-emerald-400" : "text-yellow-400"}
          />
        </div>

        {/* Market Movers */}
        {topMovers.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />
                Lëvizjet e Tregut — 7 ditët e fundit
                <Badge variant="warning" className="text-[10px] ml-1">{topMovers.length} ndryshime</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topMovers.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-gray-800/50 p-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                      m.changePct > 0 ? "bg-red-500/15" : "bg-emerald-500/15"
                    }`}>
                      {m.changePct > 0
                        ? <TrendingUp className="h-4 w-4 text-red-400" />
                        : <TrendingDown className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {m.ourProductName ?? m.productName}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">{m.competitorName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-gray-400">{formatCurrency(m.oldPrice)}</span>
                        <span className="text-[10px] text-gray-600">→</span>
                        <span className="text-[11px] text-white font-medium">{formatCurrency(m.newPrice)}</span>
                        <span className={`text-[10px] font-semibold ${m.changePct > 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {m.changePct > 0 ? "+" : ""}{m.changePct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter bar */}
        <FilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          opportunitiesOnly={opportunitiesOnly}
          totalShown={filtered.length}
          totalAll={rows.length}
        />

        {/* Table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-[11px] uppercase tracking-wider text-gray-500">
                    <th className="text-left py-3 px-4 sticky left-0 bg-gray-900 z-10">Produkti</th>
                    <th className="text-right py-3 px-4">Çmimi Ynë</th>
                    {competitorList.map((c) => (
                      <th key={c.slug} className="text-right py-3 px-3 whitespace-nowrap">
                        {c.name}
                      </th>
                    ))}
                    <th className="text-right py-3 px-4">Mes. e Tregut</th>
                    <th className="text-center py-3 px-4">Pozicioni Ynë</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={competitorList.length + 4}
                        className="py-12 text-center text-sm text-gray-500"
                      >
                        Nuk u gjetën produkte me këto filtra.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const hasAnyCompetitorData = Array.from(r.competitorPrices.values()).some(
                        (v) => v !== null
                      );
                      return (
                        <tr
                          key={r.id}
                          className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 sticky left-0 bg-gray-900 z-10">
                            <div className="min-w-[180px]">
                              <p className="text-white font-medium text-xs">{r.name}</p>
                              <p className="text-[11px] text-gray-500">
                                {r.brand ? `${r.brand} · ` : ""}
                                <span className="text-gray-600">{r.sku}</span>
                              </p>
                              <p className="text-[10px] text-gray-600 mt-0.5">
                                {categoryLabel(r.category)}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-base font-bold text-white">
                              {formatCurrency(r.ourPrice)}
                            </span>
                          </td>
                          {!hasAnyCompetitorData ? (
                            <td
                              colSpan={competitorList.length}
                              className="py-3 px-4 text-center text-xs text-gray-600 italic"
                            >
                              Nuk ka të dhëna konkurruese ende
                            </td>
                          ) : (
                            competitorList.map((c) => {
                              const cp = r.competitorPrices.get(c.slug);
                              return (
                                <td key={c.slug} className="py-3 px-3 text-right whitespace-nowrap">
                                  {cp === null || cp === undefined ? (
                                    <span className="text-gray-700">—</span>
                                  ) : (
                                    <PriceCell ourPrice={r.ourPrice} competitorPrice={cp} />
                                  )}
                                </td>
                              );
                            })
                          )}
                          <td className="py-3 px-4 text-right">
                            {r.marketAvg === null ? (
                              <span className="text-gray-700">—</span>
                            ) : (
                              <div>
                                <div className="text-xs text-white font-medium">
                                  {formatCurrency(r.marketAvg)}
                                </div>
                                {r.gapPct !== null && (
                                  <div
                                    className={`text-[10px] ${
                                      r.gapPct > 1
                                        ? "text-red-400"
                                        : r.gapPct < -1
                                          ? "text-emerald-400"
                                          : "text-yellow-400"
                                    }`}
                                  >
                                    {r.gapPct > 0 ? "+" : ""}
                                    {formatPercent(r.gapPct)}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <PositionBadge position={r.position} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClass = "text-white",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {icon}
          <span>{label}</span>
        </div>
        <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function PriceCell({ ourPrice, competitorPrice }: { ourPrice: number; competitorPrice: number }) {
  const diffPct = ((ourPrice - competitorPrice) / competitorPrice) * 100;
  let badge: { icon: React.ReactNode; cls: string };
  if (diffPct < -1) {
    badge = {
      icon: <TrendingDown className="h-3 w-3" />,
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    };
  } else if (diffPct > 1) {
    badge = {
      icon: <TrendingUp className="h-3 w-3" />,
      cls: "bg-red-500/15 text-red-400 border-red-500/30",
    };
  } else {
    badge = {
      icon: <Minus className="h-3 w-3" />,
      cls: "bg-gray-700/40 text-gray-400 border-gray-600",
    };
  }
  return (
    <div className="inline-flex flex-col items-end gap-0.5">
      <span className="text-xs text-gray-200">{formatCurrency(competitorPrice)}</span>
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${badge.cls}`}
      >
        {badge.icon}
        {diffPct > 0 ? "+" : ""}
        {diffPct.toFixed(1)}%
      </span>
    </div>
  );
}

function PositionBadge({ position }: { position: "CHEAPEST" | "MIDPACK" | "MOST_EXPENSIVE" | "NO_DATA" }) {
  if (position === "NO_DATA") {
    return <span className="text-[10px] text-gray-600">—</span>;
  }
  const map = {
    CHEAPEST: {
      label: "Më i Liri",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    MIDPACK: { label: "Mesatar", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    MOST_EXPENSIVE: { label: "Më i Shtrenjti", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  } as const;
  const v = map[position];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${v.cls}`}>
      {v.label}
    </span>
  );
}
