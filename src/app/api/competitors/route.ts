import { requireCompany } from "@/lib/get-company";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const competitors = await db.competitor.findMany({
      include: {
        products: {
          include: {
            prices: { orderBy: { recordedAt: "desc" }, take: 1 },
          },
        },
        companyLinks: { where: { companyId: company.id } },
      },
      orderBy: { numberOfStores: "desc" },
    });

    const enriched = competitors.map((c) => {
      const recentPrices = c.products.flatMap((p) => p.prices);
      const outOfStockCount = c.products.filter((p) => !p.isAvailable).length;
      const lastUpdate = recentPrices.length
        ? new Date(Math.max(...recentPrices.map((p) => p.recordedAt.getTime())))
        : null;

      return {
        id: c.id,
        name: c.name,
        nameAlbanian: c.nameAlbanian,
        slug: c.slug,
        hqCity: c.hqCity,
        numberOfStores: c.numberOfStores,
        pricingStrategy: c.pricingStrategy,
        description: c.description,
        isTracked: c.companyLinks[0]?.isTracked ?? false,
        productCount: c.products.length,
        outOfStockCount,
        lastUpdate,
      };
    });

    return NextResponse.json({ competitors: enriched });
  } catch (err) {
    console.error("Competitors error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
