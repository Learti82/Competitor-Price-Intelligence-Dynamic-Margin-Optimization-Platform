import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Demo company for now (in production, use Clerk org)
    const company = await db.company.findFirst({
      where: { clerkOrgId: "demo_org_markal" },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const [
      totalProducts,
      pendingRecommendations,
      unreadAlerts,
      totalCompetitors,
      recentPriceChanges,
      avgMargin,
    ] = await Promise.all([
      db.product.count({ where: { companyId: company.id, isActive: true } }),
      db.priceRecommendation.count({ where: { companyId: company.id, status: "PENDING" } }),
      db.marginAlert.count({ where: { companyId: company.id, isRead: false } }),
      db.companyCompetitor.count({ where: { companyId: company.id, isTracked: true } }),
      db.competitorPrice.count({
        where: {
          recordedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      db.product.aggregate({
        where: { companyId: company.id, isActive: true },
        _avg: { currentMargin: true },
      }),
    ]);

    // Revenue opportunity from pending recommendations
    const recommendations = await db.priceRecommendation.findMany({
      where: { companyId: company.id, status: "PENDING" },
      select: { expectedRevenueDelta: true },
    });
    const totalRevenueOpportunity = recommendations.reduce(
      (sum, r) => sum + Math.max(0, r.expectedRevenueDelta),
      0
    );

    // Products below 5% margin (at risk)
    const atRiskProducts = await db.product.count({
      where: { companyId: company.id, currentMargin: { lt: 5 } },
    });

    return NextResponse.json({
      totalProducts,
      pendingRecommendations,
      unreadAlerts,
      totalCompetitors,
      recentPriceChanges,
      avgMargin: avgMargin._avg.currentMargin ?? 0,
      totalRevenueOpportunity,
      atRiskProducts,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
