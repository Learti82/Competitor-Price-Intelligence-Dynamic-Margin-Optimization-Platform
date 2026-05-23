import { requireCompany } from "@/lib/get-company";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeVivaFresh } from "@/lib/scrapers/viva-fresh";
import { ProductCategory } from "@prisma/client";

const VIVA_FRESH_SLUG = "viva-fresh";

function toProductCategory(cat: string): ProductCategory {
  const valid = Object.values(ProductCategory) as string[];
  return valid.includes(cat) ? (cat as ProductCategory) : ProductCategory.SNACKS_CONFECTIONERY;
}

export async function POST(_req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const run = await db.scraperRun.create({
      data: {
        companyId: company.id,
        status: "RUNNING",
        log: [`Scraper started at ${new Date().toISOString()}`],
      },
    });

    const logEntries: string[] = [`Scraper started at ${new Date().toISOString()}`];
    let itemsScraped = 0;

    // Get or create Viva Fresh competitor
    let vivaFresh = await db.competitor.findUnique({ where: { slug: VIVA_FRESH_SLUG } });
    if (!vivaFresh) {
      vivaFresh = await db.competitor.create({
        data: {
          name: "Viva Fresh",
          slug: VIVA_FRESH_SLUG,
          hqCity: "Prishtinë",
          numberOfStores: 22,
          pricingStrategy: "HiLo",
          websiteUrl: "https://online.vivafresh.shop",
          isActive: true,
        },
      });
      logEntries.push("Created Viva Fresh competitor");
    }

    // Ensure company tracks Viva Fresh
    await db.companyCompetitor.upsert({
      where: { companyId_competitorId: { companyId: company.id, competitorId: vivaFresh.id } },
      update: {},
      create: { companyId: company.id, competitorId: vivaFresh.id, isTracked: true },
    });

    logEntries.push("Scraping Viva Fresh online shop...");

    const { products, log: scraperLog, pagesScraped } = await scrapeVivaFresh(3);
    logEntries.push(...scraperLog);
    logEntries.push(`Pages scraped: ${pagesScraped}, products found: ${products.length}`);

    if (products.length === 0) {
      logEntries.push("WARNING: No products scraped. CSS selectors may need updating.");
      logEntries.push("Open https://online.vivafresh.shop, right-click a product → Inspect, and update SELECTORS in src/lib/scrapers/viva-fresh.ts");
    }

    // Save products and prices to DB
    for (const p of products) {
      const competitorProduct = await db.competitorProduct.upsert({
        where: { competitorId_name: { competitorId: vivaFresh.id, name: p.name } },
        update: {
          isAvailable: true,
          lastSeenAt: new Date(),
          ...(p.brand ? { brand: p.brand } : {}),
        },
        create: {
          competitorId: vivaFresh.id,
          name: p.name,
          brand: p.brand,
          category: toProductCategory(p.category),
          sku: p.sku,
          isAvailable: true,
          lastSeenAt: new Date(),
        },
      });

      await db.competitorPrice.create({
        data: {
          competitorProductId: competitorProduct.id,
          price: p.price,
          promotionalPrice: p.isOnPromotion ? p.originalPrice : null,
          isOnPromotion: p.isOnPromotion,
          source: "WEB_SCRAPE",
          sourceUrl: p.sourceUrl,
          recordedAt: new Date(),
        },
      });

      itemsScraped++;
    }

    logEntries.push(`Saved ${itemsScraped} price records`);
    logEntries.push(`Completed at ${new Date().toISOString()}`);

    await db.scraperRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        itemsScraped,
        completedAt: new Date(),
        log: logEntries,
      },
    });

    return NextResponse.json({ success: true, itemsScraped, runId: run.id, log: logEntries });
  } catch (err) {
    console.error("Scraper POST error:", err);
    return NextResponse.json({ error: "Internal error", details: String(err) }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const runs = await db.scraperRun.findMany({
      where: { companyId: company.id },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ runs });
  } catch (err) {
    console.error("Scraper GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
