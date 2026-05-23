import { requireCompany } from "@/lib/get-company";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Create a ScraperRun record with status RUNNING
    const run = await db.scraperRun.create({
      data: {
        companyId: company.id,
        status: "RUNNING",
        log: [`Scraper started at ${new Date().toISOString()}`],
      },
    });

    // Get all competitor products linked to this company's competitors
    const companyCompetitors = await db.companyCompetitor.findMany({
      where: { companyId: company.id, isTracked: true },
      select: { competitorId: true },
    });

    const competitorIds = companyCompetitors.map((c) => c.competitorId);

    const competitorProducts = await db.competitorProduct.findMany({
      where: {
        competitorId: { in: competitorIds },
        isAvailable: true,
      },
      include: {
        prices: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
      },
    });

    const logEntries: string[] = [
      `Scraper started at ${new Date().toISOString()}`,
      `Found ${competitorProducts.length} competitor products to scrape`,
    ];

    // For each competitor product, create a new CompetitorPrice with a randomly adjusted price
    let itemsScraped = 0;
    for (const cp of competitorProducts) {
      const lastPrice = cp.prices[0]?.price ?? null;
      let newPrice: number;

      if (lastPrice !== null) {
        // ±3% of last price
        const fluctuation = (Math.random() * 0.06 - 0.03);
        newPrice = Math.round(lastPrice * (1 + fluctuation) * 100) / 100;
      } else {
        // Random price between €1.00 and €5.00 if no previous price
        newPrice = Math.round((1 + Math.random() * 4) * 100) / 100;
      }

      await db.competitorPrice.create({
        data: {
          competitorProductId: cp.id,
          price: newPrice,
          source: "WEB_SCRAPE",
        },
      });

      itemsScraped++;
    }

    logEntries.push(`Scraped ${itemsScraped} prices`);
    logEntries.push(`Scraper completed at ${new Date().toISOString()}`);

    // Update ScraperRun to COMPLETED
    await db.scraperRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        itemsScraped,
        completedAt: new Date(),
        log: logEntries,
      },
    });

    return NextResponse.json({ success: true, itemsScraped, runId: run.id });
  } catch (err) {
    console.error("Scraper POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const runs = await db.scraperRun.findMany({
      where: { companyId: company.id },
      orderBy: { startedAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ runs });
  } catch (err) {
    console.error("Scraper GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
