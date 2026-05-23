import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductPriceHistoryChart } from "@/components/dashboard/product-price-history-chart";
import { formatCurrency, formatPercent, getMarginColor } from "@/lib/utils";
import { subDays } from "date-fns";
import Link from "next/link";

async function getProductDetail(id: string, companyId: string) {
  const thirtyDaysAgo = subDays(new Date(), 30);
  const sixtyDaysAgo = subDays(new Date(), 60);

  const [product, priceHistory] = await Promise.all([
    db.product.findFirst({
      where: { id, companyId },
      include: {
        competitorMappings: {
          include: {
            competitorProduct: {
              include: {
                competitor: { select: { name: true } },
                prices: {
                  where: { recordedAt: { gte: thirtyDaysAgo } },
                  orderBy: { recordedAt: "asc" },
                },
              },
            },
          },
        },
        recommendations: {
          where: { status: "PENDING" },
          orderBy: { confidenceScore: "desc" },
          take: 3,
        },
      },
    }),
    db.productPrice.findMany({
      where: {
        productId: id,
        recordedAt: { gte: sixtyDaysAgo },
      },
      orderBy: { recordedAt: "asc" },
      select: { price: true, recordedAt: true },
    }),
  ]);

  return { product, priceHistory };
}

function deduplicateByDay(prices: { price: number; recordedAt: Date }[]) {
  const seen = new Set<string>();
  const result: { date: string; price: number }[] = [];
  for (const p of prices) {
    const dateKey = p.recordedAt.toISOString().slice(0, 10);
    if (!seen.has(dateKey)) {
      seen.add(dateKey);
      result.push({ date: dateKey, price: p.price });
    }
  }
  return result;
}

function getConfidenceVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 0.8) return "success";
  if (score >= 0.5) return "warning";
  return "danger";
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await requireCompany();

  if (!company) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Kompania nuk u gjet.</p>
      </div>
    );
  }

  const { product, priceHistory } = await getProductDetail(id, company.id);

  if (!product) {
    return (
      <div className="flex flex-col">
        <Header title="Produkt i panjohur" subtitle="Produkti nuk u gjet" />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-2xl font-bold text-white mb-2">404</p>
          <p className="text-gray-400 mb-6">Produkti nuk u gjet ose nuk i përket kompanisë suaj.</p>
          <Link
            href="/dashboard/products"
            className="text-blue-400 hover:underline text-sm"
          >
            ← Kthehu te lista e produkteve
          </Link>
        </div>
      </div>
    );
  }

  // Build our price series (one per day)
  const ourPrices = deduplicateByDay(priceHistory);

  // Build competitor price series
  const competitorPrices = product.competitorMappings.map((mapping) => {
    const cp = mapping.competitorProduct;
    const prices = deduplicateByDay(
      cp.prices.map((p) => ({ price: p.price, recordedAt: p.recordedAt }))
    );
    return { name: cp.competitor.name, prices };
  });

  const margin = product.currentMargin;

  return (
    <div className="flex flex-col">
      <Header
        title={product.name}
        subtitle={`SKU: ${product.sku}${product.brand ? ` • ${product.brand}` : ""}`}
        actions={
          <Link href="/dashboard/products">
            <span className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Produktet
            </span>
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stat cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500">Çmimi aktual</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(product.currentPrice)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500">COGS</p>
              <p className="text-2xl font-bold text-gray-300 mt-1">
                {formatCurrency(product.cogs)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500">Marzhi aktual</p>
              <p className={`text-2xl font-bold mt-1 ${getMarginColor(margin)}`}>
                {formatPercent(margin)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500">Min / Max Marzhi</p>
              <p className="text-lg font-bold text-white mt-1">
                <span className="text-red-400">{formatPercent(product.minMargin)}</span>
                <span className="text-gray-600 mx-1">/</span>
                <span className="text-emerald-400">{formatPercent(product.maxMargin)}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Price History Chart */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Historiku i çmimeve (60 ditë)</CardTitle>
          </CardHeader>
          <CardContent>
            {ourPrices.length === 0 && competitorPrices.every((c) => c.prices.length === 0) ? (
              <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
                Nuk ka të dhëna të çmimeve për periudhën e zgjedhur.
              </div>
            ) : (
              <ProductPriceHistoryChart
                ourPrices={ourPrices}
                competitorPrices={competitorPrices}
              />
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Recommendations */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-base">
                Rekomandimet në pritje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.recommendations.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nuk ka rekomandime aktive për këtë produkt.
                </p>
              ) : (
                <div className="space-y-3">
                  {product.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-lg border border-gray-800 bg-gray-800/50 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          {formatCurrency(rec.recommendedPrice)}
                        </span>
                        <Badge variant={getConfidenceVariant(rec.confidenceScore)}>
                          {formatPercent(rec.confidenceScore * 100, 0)} besueshmëri
                        </Badge>
                      </div>
                      <p className={`text-xs font-medium ${getMarginColor(rec.recommendedMargin)}`}>
                        Marzhi i ri: {formatPercent(rec.recommendedMargin)}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {rec.rationaleAlbanian ?? rec.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competitor mappings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-base">
                Konkurrentët e lidhur
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.competitorMappings.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Ky produkt nuk ka produkte konkurrente të lidhura.
                </p>
              ) : (
                <div className="space-y-2">
                  {product.competitorMappings.map((mapping) => {
                    const cp = mapping.competitorProduct;
                    const latestPrice = cp.prices[cp.prices.length - 1];
                    return (
                      <div
                        key={mapping.id}
                        className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/30 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-200">
                            {cp.competitor.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {cp.name}
                          </p>
                        </div>
                        <div className="text-right">
                          {latestPrice ? (
                            <p className="text-sm font-bold text-white">
                              {formatCurrency(latestPrice.price)}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-600">Pa çmim</p>
                          )}
                          <Badge
                            variant="outline"
                            className="text-xs border-gray-700 text-gray-500"
                          >
                            {mapping.isVerified ? "Verifikuar" : "E paverifikuar"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
