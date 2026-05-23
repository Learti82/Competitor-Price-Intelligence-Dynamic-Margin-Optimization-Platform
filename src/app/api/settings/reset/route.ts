import { NextResponse } from "next/server";
import { requireCompany, getActorName, getAuthUser } from "@/lib/get-company";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const company = await requireCompany();
    if (!company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await getAuthUser();
    const actorName = await getActorName();

    // Gather competitors linked to this company so we can wipe their products
    const companyCompetitors = await db.companyCompetitor.findMany({
      where: { companyId: company.id },
      select: { competitorId: true },
    });
    const competitorIds = companyCompetitors.map((cc) => cc.competitorId);

    // Wipe all company data in dependency-safe order
    await db.priceRecommendation.deleteMany({ where: { companyId: company.id } });
    await db.marginAlert.deleteMany({ where: { companyId: company.id } });
    await db.pricingRule.deleteMany({ where: { companyId: company.id } });
    await db.promotion.deleteMany({ where: { companyId: company.id } });
    await db.scraperRun.deleteMany({ where: { companyId: company.id } });
    await db.store.deleteMany({ where: { companyId: company.id } });
    // Products cascade-delete their price history, mappings, recommendations, alerts
    await db.product.deleteMany({ where: { companyId: company.id } });
    // Competitor products for competitors tracked by this company
    if (competitorIds.length > 0) {
      await db.competitorProduct.deleteMany({
        where: { competitorId: { in: competitorIds } },
      });
      await db.companyCompetitor.deleteMany({ where: { companyId: company.id } });
    }
    await db.auditLog.deleteMany({ where: { companyId: company.id } });

    // Write a single audit log to confirm the reset
    await db.auditLog.create({
      data: {
        companyId: company.id,
        userId: userId ?? "system",
        userName: actorName,
        action: "DATA_RESET",
        entityType: "Company",
        entityId: company.id,
        reason: "Full data reset from settings page",
      },
    });

    return NextResponse.json({ ok: true, message: "Të dhënat u fshiën. Rifilloni nga paneli kryesor." });
  } catch (err) {
    console.error("Settings reset error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
