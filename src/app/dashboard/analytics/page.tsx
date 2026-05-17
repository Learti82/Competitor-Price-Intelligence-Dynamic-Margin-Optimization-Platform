import { Header } from "@/components/layout/header";
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";
import { db } from "@/lib/db";
import { subDays } from "date-fns";

async function getAnalyticsData() {
  const company = await db.company.findFirst({
    where: { clerkOrgId: "demo_org_markal" },
  });
  if (!company) return null;

  const since = subDays(new Date(), 30);

  const [categoryStats, regionStats, competitorComparison, appliedRecs] = await Promise.all([
    // Category margin stats
    db.product.groupBy({
      by: ["category"],
      where: { companyId: company.id, isActive: true },
      _avg: { currentMargin: true, currentPrice: true },
      _count: { id: true },
    }),
    // Store/region stats (using product prices)
    db.store.findMany({
      where: { companyId: company.id, isActive: true },
      select: {
        name: true,
        region: true,
        city: true,
      },
    }),
    // Competitor price ranges
    db.competitor.findMany({
      include: {
        products: {
          include: {
            prices: { where: { recordedAt: { gte: since } }, orderBy: { recordedAt: "desc" }, take: 3 },
          },
          take: 50,
        },
      },
      where: { companyLinks: { some: { companyId: company.id } } },
    }),
    // Revenue from applied recommendations
    db.priceRecommendation.aggregate({
      where: { companyId: company.id, status: "APPLIED" },
      _sum: { expectedRevenueDelta: true },
      _count: { id: true },
    }),
  ]);

  return {
    categoryStats,
    regionStats,
    competitorComparison: competitorComparison.map((c) => ({
      name: c.name,
      pricingStrategy: c.pricingStrategy,
      avgPrice:
        c.products.length > 0
          ? c.products
              .flatMap((p) => p.prices.map((pr) => pr.price))
              .reduce((a, b) => a + b, 0) /
            Math.max(1, c.products.flatMap((p) => p.prices).length)
          : 0,
      productCount: c.products.length,
    })),
    appliedRevenue: appliedRecs._sum.expectedRevenueDelta ?? 0,
    appliedCount: appliedRecs._count.id,
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="flex flex-col">
      <Header title="Analitika" subtitle="Analizë e thellë e performancës së marzhit" />
      <div className="p-6">
        {data ? (
          <AnalyticsDashboard data={data} />
        ) : (
          <div className="text-center text-gray-500 py-16">Nuk u gjet kompania.</div>
        )}
      </div>
    </div>
  );
}
