import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") ?? "30");
    const productId = searchParams.get("productId");

    const company = await db.company.findFirst({
      where: { clerkOrgId: "demo_org_markal" },
    });
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const since = subDays(new Date(), days);

    if (productId) {
      // Single product detailed view
      const [ourHistory, competitorPrices] = await Promise.all([
        db.productPrice.findMany({
          where: { productId, recordedAt: { gte: since } },
          orderBy: { recordedAt: "asc" },
        }),
        db.competitorProductMap.findMany({
          where: { productId },
          include: {
            competitorProduct: {
              include: {
                competitor: { select: { name: true, slug: true, pricingStrategy: true } },
                prices: {
                  where: { recordedAt: { gte: since } },
                  orderBy: { recordedAt: "asc" },
                },
              },
            },
          },
        }),
      ]);

      return NextResponse.json({ ourHistory, competitorPrices });
    }

    // Category-level trend
    const products = await db.product.findMany({
      where: { companyId: company.id, isActive: true },
      include: {
        pricePoints: {
          where: { recordedAt: { gte: since } },
          orderBy: { recordedAt: "asc" },
        },
      },
      take: 10,
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
