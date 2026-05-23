import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeVivaFresh } from "@/lib/scrapers/viva-fresh";
import { ProductCategory } from "@prisma/client";

// This endpoint is called by Vercel Cron (or any external scheduler).
// Protect it with CRON_SECRET in .env so only the scheduler can trigger it.
// Add to vercel.json:
// {
//   "crons": [{ "path": "/api/cron/scrape", "schedule": "0 6 * * *" }]
// }

const VIVA_FRESH_SLUG = "viva-fresh";

function toProductCategory(cat: string): ProductCategory {
  const valid = Object.values(ProductCategory) as string[];
  return valid.includes(cat) ? (cat as ProductCategory) : ProductCategory.SNACKS_CONFECTIONERY;
}

export async function GET(req: NextRequest) {
  // Verify secret
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [`[CRON] Scrape job started at ${new Date().toISOString()}`];
  let totalScraped = 0;

  try {
    // Run for ALL companies that track Viva Fresh
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
    }

    const trackingCompanies = await db.companyCompetitor.findMany({
      where: { competitorId: vivaFresh.id, isTracked: true },
      select: { companyId: true },
    });

    if (trackingCompanies.length === 0) {
      log.push("No companies tracking Viva Fresh — skipping");
      return NextResponse.json({ success: true, log });
    }

    // Scrape once, apply to all companies
    log.push("Scraping Viva Fresh...");
    const { products, log: scraperLog } = await scrapeVivaFresh(5);
    log.push(...scraperLog);

    // Save products (shared across companies — competitor products are global)
    for (const p of products) {
      const cp = await db.competitorProduct.upsert({
        where: { competitorId_name: { competitorId: vivaFresh.id, name: p.name } },
        update: { isAvailable: true, lastSeenAt: new Date() },
        create: {
          competitorId: vivaFresh.id,
          name: p.name,
          brand: p.brand,
          category: toProductCategory(p.category),
          isAvailable: true,
          lastSeenAt: new Date(),
        },
      });

      await db.competitorPrice.create({
        data: {
          competitorProductId: cp.id,
          price: p.price,
          promotionalPrice: p.isOnPromotion ? p.originalPrice : null,
          isOnPromotion: p.isOnPromotion,
          source: "WEB_SCRAPE",
          sourceUrl: p.sourceUrl,
          recordedAt: new Date(),
        },
      });

      totalScraped++;
    }

    // Create a ScraperRun record for each tracking company
    for (const { companyId } of trackingCompanies) {
      await db.scraperRun.create({
        data: {
          companyId,
          status: "COMPLETED",
          itemsScraped: totalScraped,
          completedAt: new Date(),
          log,
        },
      });
    }

    log.push(`[CRON] Done — ${totalScraped} prices saved`);
    return NextResponse.json({ success: true, totalScraped, log });
  } catch (err) {
    console.error("[CRON] Scrape error:", err);
    return NextResponse.json({ error: "Internal error", details: String(err) }, { status: 500 });
  }
}
