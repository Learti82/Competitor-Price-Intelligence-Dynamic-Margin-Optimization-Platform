import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCompany, getAuthUser, getActorName } from "@/lib/get-company";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "PENDING";
    const minConfidence = parseFloat(searchParams.get("minConfidence") ?? "0");
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const recommendations = await db.priceRecommendation.findMany({
      where: { companyId: company.id, status: status as any, confidenceScore: { gte: minConfidence } },
      include: {
        product: { select: { name: true, nameAlbanian: true, brand: true, category: true, sku: true, unitLabel: true } },
      },
      orderBy: [{ confidenceScore: "desc" }, { expectedRevenueDelta: "desc" }],
      take: 100,
    });

    const totalOpportunity = recommendations
      .filter((r) => r.expectedRevenueDelta > 0)
      .reduce((sum, r) => sum + r.expectedRevenueDelta, 0);

    return NextResponse.json({ recommendations, totalOpportunity });
  } catch (err) {
    console.error("Recommendations error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, action, reason } = await req.json();
    if (!id || !action) return NextResponse.json({ error: "Missing id or action" }, { status: 400 });

    const userId = await getAuthUser();
    const company = await requireCompany();
    if (!userId || !company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actorName = await getActorName();

    const update =
      action === "APPLY"
        ? { status: "APPLIED" as const, appliedAt: new Date(), appliedBy: userId }
        : { status: "DISMISSED" as const, dismissedAt: new Date(), dismissedBy: userId, dismissReason: reason };

    const rec = await db.priceRecommendation.update({ where: { id }, data: update });

    if (action === "APPLY") {
      await db.product.update({
        where: { id: rec.productId },
        data: { currentPrice: rec.recommendedPrice, currentMargin: rec.recommendedMargin },
      });

      await db.auditLog.create({
        data: {
          companyId: company.id,
          userId,
          userName: actorName,
          action: "RECOMMENDATION_APPLIED",
          entityType: "PriceRecommendation",
          entityId: id,
          reason: reason ?? "Rekomandim AI i zbatuar",
          newValue: { recommendedPrice: rec.recommendedPrice, recommendedMargin: rec.recommendedMargin },
        },
      });
    }

    return NextResponse.json({ success: true, recommendation: rec });
  } catch (err) {
    console.error("Recommendation update error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
