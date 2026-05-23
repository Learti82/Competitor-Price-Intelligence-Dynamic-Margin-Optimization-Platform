import { requireCompany } from "@/lib/get-company";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ProductCategory } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { competitorId, productName, brand, category, price, isOnPromotion, originalPrice, notes } = body;

    if (!competitorId || !productName || !price) {
      return NextResponse.json({ error: "competitorId, productName, and price are required" }, { status: 400 });
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: "price must be a positive number" }, { status: 400 });
    }

    // Verify competitor belongs to company
    const link = await db.companyCompetitor.findFirst({
      where: { companyId: company.id, competitorId, isTracked: true },
    });
    if (!link) return NextResponse.json({ error: "Competitor not tracked" }, { status: 403 });

    const validCategories = Object.values(ProductCategory) as string[];
    const productCategory = validCategories.includes(category)
      ? (category as ProductCategory)
      : ProductCategory.SNACKS_CONFECTIONERY;

    // Upsert competitor product
    const competitorProduct = await db.competitorProduct.upsert({
      where: { competitorId_name: { competitorId, name: productName.trim() } },
      update: { isAvailable: true, lastSeenAt: new Date(), ...(brand ? { brand } : {}) },
      create: {
        competitorId,
        name: productName.trim(),
        brand: brand || null,
        category: productCategory,
        isAvailable: true,
        lastSeenAt: new Date(),
      },
    });

    // Record the price
    const priceRecord = await db.competitorPrice.create({
      data: {
        competitorProductId: competitorProduct.id,
        price: priceNum,
        promotionalPrice: isOnPromotion && originalPrice ? parseFloat(originalPrice) : null,
        isOnPromotion: !!isOnPromotion,
        source: "MANUAL",
        recordedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, priceRecord, competitorProduct });
  } catch (err) {
    console.error("Manual price POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
