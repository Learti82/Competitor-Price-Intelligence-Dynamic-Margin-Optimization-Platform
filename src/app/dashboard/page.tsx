import { requireCompany } from "@/lib/get-company";
import { Header } from "@/components/layout/header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { PriceHeatmap } from "@/components/dashboard/price-heatmap";
import { RecentAlerts } from "@/components/dashboard/recent-alerts";
import { TopRecommendations } from "@/components/dashboard/top-recommendations";
import { CompetitorActivity } from "@/components/dashboard/competitor-activity";
import { MarginTrend } from "@/components/dashboard/margin-trend";
import { SetupPrompt } from "@/components/dashboard/setup-prompt";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { db } from "@/lib/db";

async function getDashboardData() {
  const company = await requireCompany();

  if (!company) return null;

  const [
    stats,
    recentAlerts,
    topRecommendations,
    products,
    competitors,
    marginHistory,
  ] = await Promise.all([
    // Stats
    Promise.all([
      db.product.count({ where: { companyId: company.id, isActive: true } }),
      db.priceRecommendation.count({ where: { companyId: company.id, status: "PENDING" } }),
      db.marginAlert.count({ where: { companyId: company.id, isRead: false } }),
      db.companyCompetitor.count({ where: { companyId: company.id, isTracked: true } }),
      db.product.aggregate({
        where: { companyId: company.id, isActive: true },
        _avg: { currentMargin: true },
      }),
      db.priceRecommendation.aggregate({
        where: { companyId: company.id, status: "PENDING", expectedRevenueDelta: { gt: 0 } },
        _sum: { expectedRevenueDelta: true },
      }),
      db.marginAlert.count({ where: { companyId: company.id, isRead: false, severity: { in: ["HIGH", "CRITICAL"] } } }),
    ]),
    // Recent alerts
    db.marginAlert.findMany({
      where: { companyId: company.id },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    // Top recommendations
    db.priceRecommendation.findMany({
      where: { companyId: company.id, status: "PENDING" },
      include: { product: { select: { name: true, brand: true, category: true, unitLabel: true } } },
      orderBy: [{ confidenceScore: "desc" }, { expectedRevenueDelta: "desc" }],
      take: 6,
    }),
    // Products for heatmap
    db.product.findMany({
      where: { companyId: company.id, isActive: true },
      include: {
        competitorMappings: {
          include: {
            competitorProduct: {
              include: {
                competitor: { select: { name: true } },
                prices: { orderBy: { recordedAt: "desc" }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { currentMargin: "asc" },
      take: 30,
    }),
    // Competitor recent activity
    db.competitor.findMany({
      include: {
        products: {
          include: {
            prices: {
              where: { recordedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
              orderBy: { recordedAt: "desc" },
              take: 1,
            },
          },
        },
      },
      take: 7,
    }),
    // Our margin history
    db.productPrice.findMany({
      where: {
        product: { companyId: company.id },
        recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { recordedAt: "asc" },
      select: { recordedAt: true, margin: true },
      take: 300,
    }),
  ]);

  return {
    company,
    stats: {
      totalProducts: stats[0],
      pendingRecommendations: stats[1],
      unreadAlerts: stats[2],
      trackedCompetitors: stats[3],
      avgMargin: stats[4]._avg.currentMargin ?? 0,
      revenueOpportunity: stats[5]._sum.expectedRevenueDelta ?? 0,
      criticalAlerts: stats[6],
    },
    recentAlerts,
    topRecommendations,
    products,
    competitors,
    marginHistory,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">Kompania nuk u gjet</h2>
          <p className="text-gray-400 mt-2">Sigurohuni që baza e të dhënave është inicializuar me të dhënat demo.</p>
          <code className="mt-4 block text-xs text-gray-500">npx prisma db push && npx tsx prisma/seed.ts</code>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Paneli Kryesor"
        subtitle={`${data.company.name} • ${new Date().toLocaleDateString("sq-AL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
      />

      <div className="p-6 space-y-6">
        {data.stats.totalProducts === 0 ? (
          <SetupPrompt />
        ) : (
          <>
            <DashboardStats stats={data.stats} />

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PriceHeatmap products={data.products} />
              </div>
              <div className="space-y-4">
                <QuickActions
                  pendingRecs={data.stats.pendingRecommendations}
                  revenueOpportunity={data.stats.revenueOpportunity}
                  unreadAlerts={data.stats.unreadAlerts}
                  criticalAlerts={data.stats.criticalAlerts ?? 0}
                  avgMargin={data.stats.avgMargin}
                />
                <RecentAlerts alerts={data.recentAlerts} />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <TopRecommendations recommendations={data.topRecommendations} />
              <CompetitorActivity competitors={data.competitors} />
            </div>

            <MarginTrend marginHistory={data.marginHistory} />
          </>
        )}
      </div>
    </div>
  );
}
