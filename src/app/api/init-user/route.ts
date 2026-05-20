import { NextResponse } from "next/server";
import { requireCompanyOrInit, getAuthUser } from "@/lib/get-company";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const company = await requireCompanyOrInit();
    if (!company) return NextResponse.json({ error: "Failed to init" }, { status: 500 });

    // Check if already seeded (has products)
    const productCount = await db.product.count({ where: { companyId: company.id } });
    if (productCount > 0) {
      return NextResponse.json({ ok: true, seeded: false, companyId: company.id });
    }

    // Seed competitors if not already seeded
    const COMPETITORS = [
      { name: "Plus Market (ELKOS Group)", slug: "plus-market", hqCity: "Prishtinë", numberOfStores: 48, pricingStrategy: "EDLP" },
      { name: "Viva Fresh", slug: "viva-fresh", hqCity: "Prishtinë", numberOfStores: 22, pricingStrategy: "HiLo" },
      { name: "Proex", slug: "proex", hqCity: "Prishtinë", numberOfStores: 18, pricingStrategy: "VALUE" },
      { name: "Bucaj", slug: "bucaj", hqCity: "Prizren", numberOfStores: 14, pricingStrategy: "DISCOUNT" },
      { name: "ICA Grup", slug: "ica-grup", hqCity: "Prishtinë", numberOfStores: 31, pricingStrategy: "PREMIUM" },
      { name: "City Market", slug: "city-market", hqCity: "Prishtinë", numberOfStores: 12, pricingStrategy: "CONVENIENCE" },
      { name: "Familia", slug: "familia", hqCity: "Gjakovë", numberOfStores: 9, pricingStrategy: "VALUE" },
    ];

    const createdCompetitors = await Promise.all(
      COMPETITORS.map((c) =>
        db.competitor.upsert({
          where: { slug: c.slug },
          update: {},
          create: { ...c, isActive: true },
        })
      )
    );

    await Promise.all(
      createdCompetitors.map((comp) =>
        db.companyCompetitor.upsert({
          where: { companyId_competitorId: { companyId: company.id, competitorId: comp.id } },
          update: {},
          create: { companyId: company.id, competitorId: comp.id, isTracked: true },
        })
      )
    );

    // Seed one store
    await db.store.create({
      data: {
        companyId: company.id,
        name: `${company.name} - Qendra`,
        city: "Prishtinë",
        region: "PRISHTINA",
        storeType: "SUPERMARKET",
        salesFloorM2: 1200,
        isActive: true,
      },
    });

    // Seed sample products
    const PRODUCTS = [
      { sku: "BEV-001", name: "Coca-Cola 2L", brand: "Coca-Cola", category: "BEVERAGES", unit: "piece", unitSize: 2, unitLabel: "2L", cogs: 0.82, currentPrice: 1.15 },
      { sku: "BEV-002", name: "Pepsi 1.5L", brand: "Pepsi", category: "BEVERAGES", unit: "piece", unitSize: 1.5, unitLabel: "1.5L", cogs: 0.64, currentPrice: 0.89 },
      { sku: "BEV-003", name: "Uji Rugova 1.5L", brand: "Rugova", category: "BEVERAGES", unit: "piece", unitSize: 1.5, unitLabel: "1.5L", cogs: 0.18, currentPrice: 0.35 },
      { sku: "DAI-001", name: "Qumësht Deva 1L", brand: "Deva", category: "DAIRY", unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 0.72, currentPrice: 0.99 },
      { sku: "DAI-002", name: "Djathë i Bardhë 400g", brand: "Gëzimi", category: "DAIRY", unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 1.45, currentPrice: 2.15 },
      { sku: "DAI-003", name: "Kosi 500g", brand: "Deva", category: "DAIRY", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.68, currentPrice: 0.95 },
      { sku: "MEA-001", name: "Pulë e tërë 1kg", brand: "Kosovatex", category: "MEAT_POULTRY", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 2.45, currentPrice: 3.49 },
      { sku: "FRU-001", name: "Domate 1kg", brand: null, category: "FRUITS_VEGETABLES", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.62, currentPrice: 0.99 },
      { sku: "BAK-001", name: "Buka e bardhë 500g", brand: "Bajgora", category: "BAKERY", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.38, currentPrice: 0.55 },
      { sku: "SNK-001", name: "Lay's Çips 150g", brand: "Lay's", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.15, unitLabel: "150g", cogs: 0.72, currentPrice: 1.09 },
      { sku: "PAS-001", name: "Makarona Barilla 500g", brand: "Barilla", category: "PASTA_GRAINS", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.68, currentPrice: 0.99 },
      { sku: "OIL-001", name: "Vaj luledielli 1L", brand: "Bona", category: "OILS_FATS", unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 1.42, currentPrice: 1.99 },
      { sku: "COF-001", name: "Kafe Bona 250g", brand: "Bona", category: "COFFEE_TEA", unit: "piece", unitSize: 0.25, unitLabel: "250g", cogs: 2.15, currentPrice: 3.19 },
      { sku: "COF-002", name: "Kafe Nescafé Classic 200g", brand: "Nestlé", category: "COFFEE_TEA", unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 3.45, currentPrice: 4.89 },
      { sku: "CLE-001", name: "Ariel 3kg", brand: "P&G", category: "CLEANING", unit: "piece", unitSize: 3, unitLabel: "3kg", cogs: 4.20, currentPrice: 5.99 },
      { sku: "PER-001", name: "Head & Shoulders 400ml", brand: "P&G", category: "PERSONAL_CARE", unit: "piece", unitSize: 0.4, unitLabel: "400ml", cogs: 2.20, currentPrice: 3.15 },
      { sku: "HOU-001", name: "Letër higjienike Zewa 4-pak", brand: "Zewa", category: "HOUSEHOLD", unit: "pack", unitSize: 4, unitLabel: "4 copë", cogs: 0.88, currentPrice: 1.29 },
      { sku: "CON-001", name: "Ketchup Heinz 570g", brand: "Heinz", category: "CONDIMENTS", unit: "piece", unitSize: 0.57, unitLabel: "570g", cogs: 1.55, currentPrice: 2.19 },
      { sku: "CAN-001", name: "Ton Rio Mare 160g", brand: "Rio Mare", category: "CANNED_GOODS", unit: "piece", unitSize: 0.16, unitLabel: "160g", cogs: 1.25, currentPrice: 1.85 },
      { sku: "ALC-001", name: "Birra Peja 500ml", brand: "Peja", category: "ALCOHOL", unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 0.42, currentPrice: 0.69 },
    ];

    const createdProducts = await Promise.all(
      PRODUCTS.map((p) => {
        const margin = ((p.currentPrice - p.cogs) / p.currentPrice) * 100;
        return db.product.create({
          data: {
            companyId: company.id,
            sku: p.sku, name: p.name, brand: p.brand,
            category: p.category as any,
            unit: p.unit, unitSize: p.unitSize, unitLabel: p.unitLabel,
            cogs: p.cogs, currentPrice: p.currentPrice,
            currentMargin: parseFloat(margin.toFixed(2)),
            minMargin: 2, maxMargin: 35, isActive: true,
          },
        });
      })
    );

    // Seed competitor products + 30-day price history
    for (const competitor of createdCompetitors) {
      for (const p of PRODUCTS) {
        const baseVariance = 0.07;
        const compPrice = parseFloat((p.currentPrice * (1 + (Math.random() - 0.5) * baseVariance)).toFixed(2));
        const cp = await db.competitorProduct.upsert({
          where: { competitorId_name: { competitorId: competitor.id, name: p.name } },
          update: {},
          create: {
            competitorId: competitor.id, name: p.name, brand: p.brand,
            category: p.category as any, sku: `${competitor.slug.toUpperCase()}-${p.sku}`,
            unit: p.unit, unitSize: p.unitSize, unitLabel: p.unitLabel, isAvailable: true,
          },
        });

        const prices = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return {
            competitorProductId: cp.id,
            price: parseFloat((compPrice * (1 + (Math.random() - 0.5) * 0.04)).toFixed(2)),
            isInStock: Math.random() > 0.05,
            source: "MANUAL" as any,
            recordedAt: date,
          };
        });
        await db.competitorPrice.createMany({ data: prices, skipDuplicates: true });

        const ourProduct = createdProducts.find((prod) => prod.sku === p.sku);
        if (ourProduct) {
          await db.competitorProductMap.upsert({
            where: { productId_competitorProductId: { productId: ourProduct.id, competitorProductId: cp.id } },
            update: {},
            create: { productId: ourProduct.id, competitorProductId: cp.id, matchConfidence: 0.95, isVerified: true },
          });
        }
      }
    }

    // Seed alerts
    await db.marginAlert.createMany({
      data: [
        { companyId: company.id, alertType: "MARGIN_OPPORTUNITY", severity: "HIGH", title: "Mundësi rritje marzhi: 8 artikuj", description: "Mund të rrisni marzhit me 2% në 8 artikuj. Fitim i mundshëm: €120/ditë.", metadata: { count: 8, potentialDailyRevenue: 120 } },
        { companyId: company.id, alertType: "PRICE_SPIKE", severity: "MEDIUM", title: "Plus Market rriti çmimin e kafesë me 8%", description: "Nescafé Classic 200g u rrit nga €4.49 në €4.89. Mundësi për rritje marzhi.", metadata: { competitor: "Plus Market", changePct: 8 } },
        { companyId: company.id, alertType: "WEEKLY_SUMMARY", severity: "LOW", title: "Raporti javor — fillimi i aktivitetit", description: "Mirë se vini! Dati juaj është ngarkuar. Shikoni rekomandimet AI për të filluar.", metadata: {} },
      ],
    });

    // Seed price recommendations
    const recs = createdProducts.slice(0, 8).map((product) => {
      const competitorAvg = product.currentPrice * (0.95 + Math.random() * 0.1);
      const recPrice = parseFloat((Math.min(competitorAvg * 1.02, product.currentPrice * 1.08)).toFixed(2));
      const recMargin = ((recPrice - product.cogs) / recPrice) * 100;
      const delta = (recPrice - product.currentPrice) * 50;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      return {
        companyId: company.id, productId: product.id,
        currentPrice: product.currentPrice, currentMargin: product.currentMargin,
        recommendedPrice: recPrice, recommendedMargin: parseFloat(recMargin.toFixed(2)),
        confidenceScore: 0.72 + Math.random() * 0.25,
        expectedRevenueDelta: parseFloat(delta.toFixed(2)),
        rationale: `Based on competitor pricing analysis, a ${((recPrice / product.currentPrice - 1) * 100).toFixed(1)}% price adjustment is recommended.`,
        competitorAvgPrice: parseFloat(competitorAvg.toFixed(2)),
        expiresAt,
      };
    });
    await db.priceRecommendation.createMany({ data: recs });

    return NextResponse.json({ ok: true, seeded: true, companyId: company.id, products: createdProducts.length });
  } catch (err) {
    console.error("Init user error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
