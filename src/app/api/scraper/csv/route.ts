import { requireCompany } from "@/lib/get-company";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ProductCategory } from "@prisma/client";

// Expected CSV columns (header row required):
// competitor_name, product_name, brand, category, price, is_promotion, original_price
// competitor_name must match a tracked competitor's name (case-insensitive)
// category must be one of: BEVERAGES, DAIRY, MEAT_POULTRY, FRUITS_VEGETABLES, BAKERY, FROZEN, SNACKS_CONFECTIONERY, etc.

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

export async function POST(req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) return NextResponse.json({ error: "CSV is empty or has no data rows" }, { status: 400 });

    // Load all tracked competitors for this company
    const trackedCompetitors = await db.companyCompetitor.findMany({
      where: { companyId: company.id, isTracked: true },
      include: { competitor: true },
    });
    const competitorByName = new Map(
      trackedCompetitors.map((tc) => [tc.competitor.name.toLowerCase(), tc.competitor])
    );

    const validCategories = Object.values(ProductCategory) as string[];
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const competitorName = (row.competitor_name ?? "").toLowerCase();
      const competitor = competitorByName.get(competitorName);
      if (!competitor) {
        errors.push(`Row skipped — unknown competitor: "${row.competitor_name}"`);
        skipped++;
        continue;
      }

      const productName = row.product_name?.trim();
      if (!productName) { skipped++; continue; }

      const price = parseFloat(row.price ?? "");
      if (isNaN(price) || price <= 0) {
        errors.push(`Row skipped — invalid price for "${productName}": "${row.price}"`);
        skipped++;
        continue;
      }

      const rawCat = (row.category ?? "").trim().toUpperCase().replace(/\s+/g, "_");
      const category = validCategories.includes(rawCat)
        ? (rawCat as ProductCategory)
        : ProductCategory.SNACKS_CONFECTIONERY;

      const isPromotion = ["1", "yes", "true"].includes((row.is_promotion ?? "").toLowerCase());
      const originalPrice = parseFloat(row.original_price ?? "");

      const cp = await db.competitorProduct.upsert({
        where: { competitorId_name: { competitorId: competitor.id, name: productName } },
        update: { isAvailable: true, lastSeenAt: new Date() },
        create: {
          competitorId: competitor.id,
          name: productName,
          brand: row.brand?.trim() || null,
          category,
          isAvailable: true,
          lastSeenAt: new Date(),
        },
      });

      await db.competitorPrice.create({
        data: {
          competitorProductId: cp.id,
          price,
          promotionalPrice: isPromotion && !isNaN(originalPrice) ? originalPrice : null,
          isOnPromotion: isPromotion,
          source: "CSV_UPLOAD",
          recordedAt: new Date(),
        },
      });

      imported++;
    }

    return NextResponse.json({ success: true, imported, skipped, errors: errors.slice(0, 20) });
  } catch (err) {
    console.error("CSV import error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
