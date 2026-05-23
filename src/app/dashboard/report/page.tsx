import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { ReportClient } from "./report-client";
import { categoryLabel, formatCurrency } from "@/lib/utils";
import { subDays, format, startOfWeek, endOfWeek } from "date-fns";

async function getReportData(companyId: string) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const sevenDaysAgo = subDays(now, 7);

  const [products, pendingRecs, appliedRecs, unreadAlerts, highAlerts, company, competitors] =
    await Promise.all([
      db.product.findMany({
        where: { companyId, isActive: true },
        select: { name: true, currentMargin: true, currentPrice: true, cogs: true, category: true, minMargin: true },
        orderBy: { currentMargin: "asc" },
      }),
      db.priceRecommendation.findMany({
        where: { companyId, status: "PENDING" },
        include: { product: { select: { name: true, currentPrice: true } } },
        orderBy: { expectedRevenueDelta: "desc" },
        take: 5,
      }),
      db.priceRecommendation.findMany({
        where: { companyId, status: "APPLIED", appliedAt: { gte: sevenDaysAgo } },
        select: { expectedRevenueDelta: true },
      }),
      db.marginAlert.count({ where: { companyId, isRead: false } }),
      db.marginAlert.findMany({
        where: { companyId, isRead: false, severity: { in: ["HIGH", "CRITICAL"] } },
        select: { title: true, description: true, severity: true, alertType: true },
        take: 5,
      }),
      db.company.findUnique({ where: { id: companyId }, select: { name: true } }),
      db.competitor.findMany({
        where: { companyLinks: { some: { companyId, isTracked: true } } },
        include: {
          products: {
            include: {
              prices: {
                where: { recordedAt: { gte: sevenDaysAgo } },
                orderBy: { recordedAt: "desc" },
                take: 3,
              },
            },
            take: 30,
          },
        },
        take: 6,
      }),
    ]);

  const avgMargin = products.length
    ? products.reduce((s, p) => s + p.currentMargin, 0) / products.length
    : 0;
  const belowMinMargin = products.filter((p) => p.currentMargin < p.minMargin).length;
  const appliedRevenue = appliedRecs.reduce((s, r) => s + (r.expectedRevenueDelta ?? 0), 0);

  // Category breakdown
  const catMap: Record<string, { count: number; totalMargin: number }> = {};
  for (const p of products) {
    if (!catMap[p.category]) catMap[p.category] = { count: 0, totalMargin: 0 };
    catMap[p.category].count++;
    catMap[p.category].totalMargin += p.currentMargin;
  }
  const categoryBreakdown = Object.entries(catMap)
    .map(([cat, d]) => ({ category: cat, label: categoryLabel(cat), count: d.count, avgMargin: d.totalMargin / d.count }))
    .sort((a, b) => a.avgMargin - b.avgMargin)
    .slice(0, 8);

  // Competitor activity
  const competitorActivity = competitors
    .map((c) => ({
      name: c.name,
      changedProducts: c.products.filter((p) => p.prices.length >= 2).length,
      totalProducts: c.products.length,
    }))
    .filter((c) => c.changedProducts > 0)
    .slice(0, 4);

  return {
    companyName: company?.name ?? "Kompania",
    period: `${format(weekStart, "d MMM")} – ${format(weekEnd, "d MMM yyyy")}`,
    generatedAt: format(now, "d MMM yyyy, HH:mm"),
    stats: {
      avgMargin,
      totalProducts: products.length,
      belowMinMargin,
      pendingRecs: pendingRecs.length,
      appliedThisWeek: appliedRecs.length,
      appliedRevenue,
      unreadAlerts,
      highAlerts: highAlerts.length,
    },
    topOpportunities: pendingRecs.slice(0, 5).map((r) => ({
      product: r.product.name,
      opportunity: `+${formatCurrency(r.expectedRevenueDelta)}/ditë`,
      action: `€${r.product.currentPrice?.toFixed(2)} → €${r.recommendedPrice?.toFixed(2)}`,
    })),
    topRisks: products
      .filter((p) => p.currentMargin < p.minMargin + 2)
      .slice(0, 5)
      .map((p) => ({
        product: p.name,
        risk: `Marzhi ${p.currentMargin.toFixed(1)}% (${p.currentMargin < p.minMargin ? "nën minimum" : "afër kufirit"})`,
        severity: (p.currentMargin < p.minMargin ? "HIGH" : "MEDIUM") as "HIGH" | "MEDIUM",
      })),
    highAlerts,
    categoryBreakdown,
    competitorActivity,
  };
}

export default async function ReportPage() {
  const company = await requireCompany();
  if (!company) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Kompania nuk u gjet.</p>
      </div>
    );
  }

  const data = await getReportData(company.id);
  return <ReportClient data={data} />;
}
