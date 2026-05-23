import { NextResponse } from "next/server";
import { requireCompanyOrInit, getAuthUser } from "@/lib/get-company";
import { db } from "@/lib/db";
import {
  SEED_COMPETITORS,
  SEED_PRODUCTS,
  SEED_STORES,
  buildCompetitorPriceSeries,
  buildOwnPriceSeries,
  dailyVolumeForCategory,
  pickN,
  randInt,
} from "@/lib/seed-data";

export async function POST() {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const company = await requireCompanyOrInit();
    if (!company) return NextResponse.json({ error: "Failed to init" }, { status: 500 });

    // Already seeded?
    const productCount = await db.product.count({ where: { companyId: company.id } });
    if (productCount > 0) {
      return NextResponse.json({ ok: true, seeded: false, companyId: company.id });
    }

    // ── 1. Competitors (global) ──────────────────────────────────────────────
    let createdCompetitors: Array<{ id: string; slug: string; pricingStrategy: string | null; name: string }> = [];
    try {
      createdCompetitors = await Promise.all(
        SEED_COMPETITORS.map((c) =>
          db.competitor.upsert({
            where: { slug: c.slug },
            update: {},
            create: {
              name: c.name,
              nameAlbanian: c.nameAlbanian,
              slug: c.slug,
              hqCity: c.hqCity,
              numberOfStores: c.numberOfStores,
              pricingStrategy: c.pricingStrategy,
              description: c.description,
              websiteUrl: c.websiteUrl,
              isActive: true,
            },
            select: { id: true, slug: true, pricingStrategy: true, name: true },
          })
        )
      );

      await db.companyCompetitor.createMany({
        data: createdCompetitors.map((c) => ({
          companyId: company.id,
          competitorId: c.id,
          isTracked: true,
        })),
        skipDuplicates: true,
      });
    } catch (err) {
      console.error("Seed competitors failed:", err);
    }

    // ── 2. Stores ────────────────────────────────────────────────────────────
    let createdStores: Array<{ id: string; name: string }> = [];
    try {
      const storeCount = randInt(3, 5);
      const chosenStores = SEED_STORES.slice(0, storeCount);
      await db.store.createMany({
        data: chosenStores.map((s) => ({
          companyId: company.id,
          name: `${company.name} - ${s.name}`,
          city: s.city,
          region: s.region,
          address: s.address,
          storeType: s.storeType,
          salesFloorM2: s.salesFloorM2,
          isActive: true,
        })),
      });
      createdStores = await db.store.findMany({
        where: { companyId: company.id },
        select: { id: true, name: true },
      });
    } catch (err) {
      console.error("Seed stores failed:", err);
    }

    // ── 3. Products ─────────────────────────────────────────────────────────
    let createdProducts: Array<{
      id: string;
      sku: string;
      name: string;
      brand: string | null;
      category: string;
      cogs: number;
      currentPrice: number;
      currentMargin: number;
      unit: string;
      unitSize: number | null;
      unitLabel: string | null;
    }> = [];
    try {
      const productData = SEED_PRODUCTS.map((p) => {
        const cogs = parseFloat((p.currentPrice * (0.55 + Math.random() * 0.25)).toFixed(2));
        const margin = ((p.currentPrice - cogs) / p.currentPrice) * 100;
        return {
          companyId: company.id,
          sku: p.sku,
          name: p.name,
          nameAlbanian: p.nameAlbanian ?? p.name,
          brand: p.brand,
          category: p.category as never,
          unit: p.unit,
          unitSize: p.unitSize,
          unitLabel: p.unitLabel,
          cogs,
          currentPrice: p.currentPrice,
          currentMargin: parseFloat(margin.toFixed(2)),
          minMargin: 2,
          maxMargin: p.category === "TOBACCO" ? 20 : p.category === "ALCOHOL" ? 25 : 35,
          isActive: true,
        };
      });
      await db.product.createMany({ data: productData });
      createdProducts = await db.product.findMany({
        where: { companyId: company.id },
        select: {
          id: true, sku: true, name: true, brand: true, category: true,
          cogs: true, currentPrice: true, currentMargin: true,
          unit: true, unitSize: true, unitLabel: true,
        },
      });
    } catch (err) {
      console.error("Seed products failed:", err);
    }

    // ── 4. Competitor products + 60-day prices + mappings ───────────────────
    const competitorPriceTotals = { products: 0, prices: 0 };
    try {
      for (const product of createdProducts) {
        // Each product carried by 5-7 competitors (randomized)
        const numComps = randInt(5, 7);
        const chosenComps = pickN(createdCompetitors, Math.min(numComps, createdCompetitors.length));

        // Create competitor product records
        await db.competitorProduct.createMany({
          data: chosenComps.map((comp) => ({
            competitorId: comp.id,
            name: product.name,
            brand: product.brand,
            category: product.category as never,
            sku: `${comp.slug.toUpperCase()}-${product.sku}`,
            unit: product.unit,
            unitSize: product.unitSize,
            unitLabel: product.unitLabel,
            isAvailable: Math.random() > 0.08,
            lastSeenAt: new Date(),
          })),
          skipDuplicates: true,
        });
        competitorPriceTotals.products += chosenComps.length;

        const cps = await db.competitorProduct.findMany({
          where: {
            competitorId: { in: chosenComps.map((c) => c.id) },
            name: product.name,
          },
          select: { id: true, competitorId: true },
        });

        // Build 60-day price series for each
        const allPrices: ReturnType<typeof buildCompetitorPriceSeries> = [];
        for (const cp of cps) {
          const comp = chosenComps.find((c) => c.id === cp.competitorId);
          const strategy = comp?.pricingStrategy ?? "VALUE";
          allPrices.push(...buildCompetitorPriceSeries(product.currentPrice, strategy, cp.id));
        }
        if (allPrices.length > 0) {
          await db.competitorPrice.createMany({ data: allPrices, skipDuplicates: true });
          competitorPriceTotals.prices += allPrices.length;
        }

        // Mappings
        await db.competitorProductMap.createMany({
          data: cps.map((cp) => ({
            productId: product.id,
            competitorProductId: cp.id,
            matchConfidence: 0.92 + Math.random() * 0.08,
            isVerified: Math.random() > 0.3,
          })),
          skipDuplicates: true,
        });
      }
    } catch (err) {
      console.error("Seed competitor data failed:", err);
    }

    // ── 5. Our 60-day price history ─────────────────────────────────────────
    try {
      const defaultStoreId = createdStores[0]?.id ?? null;
      const history = createdProducts.flatMap((p) =>
        buildOwnPriceSeries(p.id, p.currentPrice, p.cogs, defaultStoreId)
      );
      // Batch in chunks to avoid huge payloads
      const CHUNK = 5000;
      for (let i = 0; i < history.length; i += CHUNK) {
        await db.productPrice.createMany({ data: history.slice(i, i + CHUNK), skipDuplicates: true });
      }
    } catch (err) {
      console.error("Seed own price history failed:", err);
    }

    // ── 6. Price recommendations (30-40) ────────────────────────────────────
    let recsCreated = 0;
    try {
      // Get latest competitor prices for product→avg
      const productSubset = pickN(createdProducts, 40);
      const recs: Parameters<typeof db.priceRecommendation.createMany>[0]["data"] = [];

      for (let idx = 0; idx < productSubset.length; idx++) {
        const product = productSubset[idx];
        // Fetch latest price per competitor mapping
        const mappings = await db.competitorProductMap.findMany({
          where: { productId: product.id },
          include: {
            competitorProduct: {
              include: {
                competitor: { select: { name: true } },
                prices: { orderBy: { recordedAt: "desc" }, take: 1 },
              },
            },
          },
        });
        const compPrices = mappings
          .map((m) => ({
            name: m.competitorProduct.competitor.name,
            price: m.competitorProduct.prices[0]?.price ?? null,
          }))
          .filter((x): x is { name: string; price: number } => x.price !== null);
        if (compPrices.length === 0) continue;

        const compMin = Math.min(...compPrices.map((c) => c.price));
        const compMax = Math.max(...compPrices.map((c) => c.price));
        const compAvg = compPrices.reduce((s, c) => s + c.price, 0) / compPrices.length;

        // Decide opportunity bucket
        const ourPrice = product.currentPrice;
        const currentMargin = product.currentMargin;
        let recPrice = ourPrice;
        let confidence = 0.75;
        let direction: "UNDERPRICED" | "LOWMARGIN" | "OVERPRICED" | null = null;

        const bucket = idx % 4; // 50% under, 25% low-margin, 25% over
        if (bucket === 0 || bucket === 1) {
          if (ourPrice < compAvg * 0.97) {
            direction = "UNDERPRICED";
            recPrice = parseFloat(Math.min(compAvg * 0.99, ourPrice * 1.05).toFixed(2));
            confidence = 0.82 + Math.random() * 0.14;
          }
        } else if (bucket === 2) {
          if (currentMargin < 8) {
            direction = "LOWMARGIN";
            recPrice = parseFloat((ourPrice * (1.03 + Math.random() * 0.02)).toFixed(2));
            confidence = 0.78 + Math.random() * 0.12;
          }
        } else {
          if (ourPrice > compAvg * 1.05) {
            direction = "OVERPRICED";
            recPrice = parseFloat(Math.max(compAvg * 1.01, ourPrice * 0.96).toFixed(2));
            confidence = 0.7 + Math.random() * 0.15;
          }
        }

        if (direction === null || Math.abs(recPrice - ourPrice) < 0.02) continue;

        const recMargin = ((recPrice - product.cogs) / recPrice) * 100;
        const volume = dailyVolumeForCategory(product.category as never);
        const revenueDelta = (recPrice - ourPrice) * volume;

        const top3 = compPrices.slice(0, 3).map((c) => `${c.name} €${c.price.toFixed(2)}`).join(", ");
        const pctChange = ((recPrice / ourPrice - 1) * 100).toFixed(1);
        const rationale =
          direction === "UNDERPRICED"
            ? `${top3}, ne €${ourPrice.toFixed(2)}. Mund të rrisim çmimin në €${recPrice.toFixed(2)} (${pctChange}%) duke ruajtur konkurrencën dhe duke rritur marzhin nga ${currentMargin.toFixed(0)}% në ${recMargin.toFixed(0)}%.`
            : direction === "LOWMARGIN"
              ? `Marzhi aktual është vetëm ${currentMargin.toFixed(1)}%, nën nivelin e shëndoshë. Konkurrentët: ${top3}. Rritje e vogël në €${recPrice.toFixed(2)} (${pctChange}%) e bie marzhin në ${recMargin.toFixed(0)}%.`
              : `Jemi mbi mesataren e tregut (€${compAvg.toFixed(2)}). Konkurrentët: ${top3}. Ulja në €${recPrice.toFixed(2)} (${pctChange}%) na rikthen konkurrencën dhe parandalon humbjen e klientëve.`;

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        recs.push({
          companyId: company.id,
          productId: product.id,
          currentPrice: ourPrice,
          currentMargin,
          recommendedPrice: recPrice,
          recommendedMargin: parseFloat(recMargin.toFixed(2)),
          confidenceScore: parseFloat(Math.min(0.96, confidence).toFixed(2)),
          expectedRevenueDelta: parseFloat(revenueDelta.toFixed(2)),
          rationale,
          rationaleAlbanian: rationale,
          competitorMinPrice: parseFloat(compMin.toFixed(2)),
          competitorMaxPrice: parseFloat(compMax.toFixed(2)),
          competitorAvgPrice: parseFloat(compAvg.toFixed(2)),
          expiresAt,
          status: "PENDING" as const,
        });
        if (recs.length >= 38) break;
      }
      if (recs.length > 0) {
        await db.priceRecommendation.createMany({ data: recs });
        recsCreated = recs.length;
      }
    } catch (err) {
      console.error("Seed recommendations failed:", err);
    }

    // ── 7. Margin alerts (15-25) ────────────────────────────────────────────
    let alertsCreated = 0;
    try {
      const alerts: Parameters<typeof db.marginAlert.createMany>[0]["data"] = [];
      const sampleProducts = pickN(createdProducts, 20);
      const sampleComps = createdCompetitors;
      const pickComp = () => sampleComps[Math.floor(Math.random() * sampleComps.length)];

      // MARGIN_OPPORTUNITY (HIGH 3-5)
      for (let i = 0; i < randInt(3, 5); i++) {
        const count = randInt(8, 28);
        const dailyGain = randInt(80, 420);
        alerts.push({
          companyId: company.id,
          alertType: "MARGIN_OPPORTUNITY" as const,
          severity: "HIGH" as const,
          title: `Mundësi rritje marzhi: ${count} artikuj`,
          titleAlbanian: `Mundësi rritje marzhi: ${count} artikuj`,
          description: `Mund të rrisni marzhit me 2% në ${count} artikuj. Fitim shtesë i mundshëm: €${dailyGain}/ditë.`,
          descriptionAlbanian: `Mund të rrisni marzhit me 2% në ${count} artikuj. Fitim shtesë i mundshëm: €${dailyGain}/ditë.`,
          metadata: { count, potentialDailyRevenue: dailyGain },
        });
      }
      // PRICE_SPIKE (MEDIUM 3-4)
      for (let i = 0; i < randInt(3, 4); i++) {
        const comp = pickComp();
        const prod = sampleProducts[i % sampleProducts.length];
        const pct = randInt(5, 18);
        const oldP = parseFloat((prod.currentPrice * (1 - pct / 100)).toFixed(2));
        alerts.push({
          companyId: company.id,
          productId: prod.id,
          alertType: "PRICE_SPIKE" as const,
          severity: "MEDIUM" as const,
          title: `${comp.name} rriti çmimin me ${pct}%`,
          titleAlbanian: `${comp.name} rriti çmimin me ${pct}%`,
          description: `${comp.name} rriti çmimin e ${prod.name} nga €${oldP} në €${prod.currentPrice.toFixed(2)}. Mundësi për rritje marzhi te ne.`,
          descriptionAlbanian: `${comp.name} rriti çmimin e ${prod.name} nga €${oldP} në €${prod.currentPrice.toFixed(2)}. Mundësi për rritje marzhi te ne.`,
          metadata: { competitor: comp.name, product: prod.name, oldPrice: oldP, newPrice: prod.currentPrice, changePct: pct },
        });
      }
      // PRICE_DROP (HIGH 2-3)
      for (let i = 0; i < randInt(2, 3); i++) {
        const comp = pickComp();
        const prod = sampleProducts[(i + 5) % sampleProducts.length];
        const pct = randInt(8, 20);
        const newP = parseFloat((prod.currentPrice * (1 - pct / 100)).toFixed(2));
        alerts.push({
          companyId: company.id,
          productId: prod.id,
          alertType: "PRICE_DROP" as const,
          severity: "HIGH" as const,
          title: `${comp.name} uli çmimin me ${pct}%`,
          titleAlbanian: `${comp.name} uli çmimin me ${pct}%`,
          description: `${comp.name} uli çmimin e ${prod.name} në €${newP} (-${pct}%) — mund të humbasim klientë nëse nuk reagojmë.`,
          descriptionAlbanian: `${comp.name} uli çmimin e ${prod.name} në €${newP} (-${pct}%) — mund të humbasim klientë nëse nuk reagojmë.`,
          metadata: { competitor: comp.name, product: prod.name, newPrice: newP, changePct: -pct },
        });
      }
      // MARGIN_RISK (CRITICAL 1-2)
      for (let i = 0; i < randInt(1, 2); i++) {
        const prod = sampleProducts[(i + 9) % sampleProducts.length];
        const margin = (1 + Math.random() * 2).toFixed(1);
        alerts.push({
          companyId: company.id,
          productId: prod.id,
          alertType: "MARGIN_RISK" as const,
          severity: "CRITICAL" as const,
          title: `Marzhi i ${prod.name} ra nën 3%`,
          titleAlbanian: `Marzhi i ${prod.name} ra nën 3%`,
          description: `${prod.name} ka marzh ${margin}% — nën pragun e shëndetshëm. Veprim i menjëhershëm i nevojshëm.`,
          descriptionAlbanian: `${prod.name} ka marzh ${margin}% — nën pragun e shëndetshëm. Veprim i menjëhershëm i nevojshëm.`,
          metadata: { product: prod.name, margin: parseFloat(margin) },
        });
      }
      // COMPETITOR_OUT_OF_STOCK (LOW 2-3)
      for (let i = 0; i < randInt(2, 3); i++) {
        const comp = pickComp();
        const prod = sampleProducts[(i + 12) % sampleProducts.length];
        alerts.push({
          companyId: company.id,
          productId: prod.id,
          alertType: "COMPETITOR_OUT_OF_STOCK" as const,
          severity: "LOW" as const,
          title: `${comp.name} pa stok — ${prod.name}`,
          titleAlbanian: `${comp.name} pa stok — ${prod.name}`,
          description: `${comp.name} është pa stok për ${prod.name}. Mundësi për rritje çmimi 5-8% derisa rikthehet.`,
          descriptionAlbanian: `${comp.name} është pa stok për ${prod.name}. Mundësi për rritje çmimi 5-8% derisa rikthehet.`,
          metadata: { competitor: comp.name, product: prod.name },
        });
      }
      // WEEKLY_SUMMARY (LOW 1)
      alerts.push({
        companyId: company.id,
        alertType: "WEEKLY_SUMMARY" as const,
        severity: "LOW" as const,
        title: `Raporti javor i marzhit`,
        titleAlbanian: `Raporti javor i marzhit`,
        description: `Java e kaluar: ${randInt(20, 45)} rekomandime të zbatuara, fitim shtesë €${randInt(8000, 18000).toLocaleString()}, mundësi të humbura €${randInt(2000, 9000).toLocaleString()}.`,
        descriptionAlbanian: `Java e kaluar: ${randInt(20, 45)} rekomandime të zbatuara, fitim shtesë €${randInt(8000, 18000).toLocaleString()}, mundësi të humbura €${randInt(2000, 9000).toLocaleString()}.`,
        metadata: {},
      });
      // COMPETITOR_STRATEGY_CHANGE (MEDIUM 1-2)
      for (let i = 0; i < randInt(1, 2); i++) {
        const comp = pickComp();
        const items = randInt(20, 80);
        alerts.push({
          companyId: company.id,
          alertType: "COMPETITOR_STRATEGY_CHANGE" as const,
          severity: "MEDIUM" as const,
          title: `${comp.name} ndërroi strategjinë e çmimit`,
          titleAlbanian: `${comp.name} ndërroi strategjinë e çmimit`,
          description: `${comp.name} ka ndryshuar ${items} çmime në 24 orë të fundit. Analiza sugjeron lëvizje strategjike.`,
          descriptionAlbanian: `${comp.name} ka ndryshuar ${items} çmime në 24 orë të fundit. Analiza sugjeron lëvizje strategjike.`,
          metadata: { competitor: comp.name, changedItems: items, period: "24h" },
        });
      }

      if (alerts.length > 0) {
        await db.marginAlert.createMany({ data: alerts });
        alertsCreated = alerts.length;
      }
    } catch (err) {
      console.error("Seed alerts failed:", err);
    }

    // ── 8. Pricing rules (5) ────────────────────────────────────────────────
    try {
      const ruleProducts = pickN(createdProducts, 2);
      await db.pricingRule.createMany({
        data: [
          {
            companyId: company.id,
            name: "Mos lejoni Plus Market të jetë -5% nën ne",
            description: "Çmimi ynë duhet të jetë maksimumi 5% mbi Plus Market.",
            ruleType: "COMPETITOR_BASED" as const,
            competitorId: createdCompetitors.find((c) => c.slug === "plus-market")?.id,
            operator: "BELOW",
            value: 5,
            valueType: "PERCENTAGE",
            isActive: true,
            priority: 10,
          },
          {
            companyId: company.id,
            name: "Mbrojtje marzhi minimal 5%",
            description: "Asnjë produkt nuk shitet me marzh nën 5%.",
            ruleType: "MARGIN_PROTECTION" as const,
            operator: "ABOVE",
            value: 5,
            valueType: "PERCENTAGE",
            minMargin: 5,
            isActive: true,
            priority: 100,
          },
          {
            companyId: company.id,
            name: "Pijet: marzh i synuar 22%",
            description: "Kategoria BEVERAGES duhet të mbajë marzh mes 20-28%.",
            ruleType: "CATEGORY_RULE" as const,
            category: "BEVERAGES" as const,
            operator: "BETWEEN",
            value: 22,
            valueType: "PERCENTAGE",
            minMargin: 20,
            maxMargin: 28,
            isActive: true,
            priority: 50,
          },
          {
            companyId: company.id,
            name: "Mishi: marzh minimal 12%",
            description: "Kategoria MEAT_POULTRY: marzh minimal për shkak të prishjes.",
            ruleType: "CATEGORY_RULE" as const,
            category: "MEAT_POULTRY" as const,
            operator: "ABOVE",
            value: 12,
            valueType: "PERCENTAGE",
            minMargin: 12,
            isActive: true,
            priority: 50,
          },
          {
            companyId: company.id,
            name: ruleProducts[0] ? `Mbroni çmimin e ${ruleProducts[0].name}` : "Mbrojtje produkti kyç",
            description: "Produkt kyç KVI — mos lejoni rritje mbi 2%.",
            ruleType: "PRODUCT_RULE" as const,
            targetProductId: ruleProducts[0]?.id,
            operator: "BELOW",
            value: 2,
            valueType: "PERCENTAGE",
            isActive: true,
            priority: 20,
          },
        ],
      });
    } catch (err) {
      console.error("Seed pricing rules failed:", err);
    }

    // ── 9. Promotions (4) ───────────────────────────────────────────────────
    try {
      const promoProducts = pickN(createdProducts, 4);
      const now = new Date();
      const promos: Parameters<typeof db.promotion.createMany>[0]["data"] = [];
      if (promoProducts[0]) {
        const start = new Date(now); start.setDate(now.getDate() - 3);
        const end = new Date(now); end.setDate(now.getDate() + 4);
        promos.push({
          companyId: company.id,
          productId: promoProducts[0].id,
          title: `${promoProducts[0].name} -20%`,
          description: `Promocion aktiv për javën e ngjarjes.`,
          discountType: "PERCENTAGE",
          discountValue: 20,
          startDate: start,
          endDate: end,
          isActive: true,
          status: "ACTIVE",
        });
      }
      if (promoProducts[1]) {
        const start = new Date(now); start.setDate(now.getDate() + 5);
        const end = new Date(now); end.setDate(now.getDate() + 12);
        promos.push({
          companyId: company.id,
          productId: promoProducts[1].id,
          title: `${promoProducts[1].name} -15%`,
          description: `Promocion i planifikuar.`,
          discountType: "PERCENTAGE",
          discountValue: 15,
          startDate: start,
          endDate: end,
          isActive: true,
          status: "SCHEDULED",
        });
      }
      if (promoProducts[2]) {
        const start = new Date(now); start.setDate(now.getDate() + 14);
        const end = new Date(now); end.setDate(now.getDate() + 21);
        promos.push({
          companyId: company.id,
          productId: promoProducts[2].id,
          title: `${promoProducts[2].name} - Ofertë Speciale`,
          description: `Promocion i ardhshëm.`,
          discountType: "PERCENTAGE",
          discountValue: 25,
          startDate: start,
          endDate: end,
          isActive: true,
          status: "SCHEDULED",
        });
      }
      if (promoProducts[3]) {
        const start = new Date(now); start.setDate(now.getDate() - 20);
        const end = new Date(now); end.setDate(now.getDate() - 10);
        promos.push({
          companyId: company.id,
          productId: promoProducts[3].id,
          title: `${promoProducts[3].name} -10% (përfunduar)`,
          description: `Promocioni i kaluar — të dhëna për ROI.`,
          discountType: "PERCENTAGE",
          discountValue: 10,
          startDate: start,
          endDate: end,
          isActive: false,
          status: "COMPLETED",
        });
      }
      if (promos.length > 0) await db.promotion.createMany({ data: promos });
    } catch (err) {
      console.error("Seed promotions failed:", err);
    }

    // ── 10. Audit log (8) ──────────────────────────────────────────────────
    try {
      const actions = [
        { action: "PRICE_UPDATED", entityType: "Product", newValue: { product: "Coca-Cola 2L", oldPrice: 1.45, newPrice: 1.50, reason: "Reagim ndaj Plus Market" } },
        { action: "RECOMMENDATION_APPLIED", entityType: "PriceRecommendation", newValue: { product: "Kafe Bona 250g", marginIncrease: 1.8, revenueImpact: 65 } },
        { action: "PRODUCT_CREATED", entityType: "Product", newValue: { product: "Nivea krem fytyre 50ml", sku: "PER-010" } },
        { action: "PROMOTION_LAUNCHED", entityType: "Promotion", newValue: { title: "Coca-Cola -20%", discount: 20 } },
        { action: "RULE_UPDATED", entityType: "PricingRule", newValue: { name: "Mbrojtje marzhi minimal 5%", isActive: true } },
        { action: "RECOMMENDATION_DISMISSED", entityType: "PriceRecommendation", newValue: { product: "Pampers 5", reason: "Furnitori po negocion" } },
        { action: "COMPETITOR_TRACKED", entityType: "Competitor", newValue: { competitor: "Interex" } },
        { action: "BULK_PRICE_UPDATE", entityType: "Product", newValue: { count: 14, category: "DAIRY" } },
      ];
      await db.auditLog.createMany({
        data: actions.map((a, idx) => {
          const ts = new Date();
          ts.setHours(ts.getHours() - idx * 3);
          return {
            companyId: company.id,
            userId,
            userName: "Pronari",
            ...a,
            createdAt: ts,
          };
        }),
      });
    } catch (err) {
      console.error("Seed audit log failed:", err);
    }

    // ── 11. Scraper runs (3) ────────────────────────────────────────────────
    try {
      const now = new Date();
      const recentDone = new Date(now); recentDone.setHours(now.getHours() - 1);
      const earlierDone = new Date(now); earlierDone.setHours(now.getHours() - 8);
      const running = new Date(now); running.setMinutes(now.getMinutes() - 2);
      await db.scraperRun.createMany({
        data: [
          {
            companyId: company.id,
            status: "COMPLETED",
            itemsScraped: randInt(800, 1400),
            log: ["Starting scrape", "Plus Market: 312 items", "Viva Fresh: 287 items", "Bucaj: 198 items", "Completed successfully"],
            startedAt: new Date(recentDone.getTime() - 7 * 60 * 1000),
            completedAt: recentDone,
          },
          {
            companyId: company.id,
            status: "COMPLETED",
            itemsScraped: randInt(700, 1200),
            log: ["Starting scrape", "Maxi: 245 items", "Interex: 198 items", "Conad: 167 items", "Completed successfully"],
            startedAt: new Date(earlierDone.getTime() - 9 * 60 * 1000),
            completedAt: earlierDone,
          },
          {
            companyId: company.id,
            status: "RUNNING",
            itemsScraped: randInt(50, 200),
            log: ["Starting scrape", "ICA Grup: in progress..."],
            startedAt: running,
          },
        ],
      });
    } catch (err) {
      console.error("Seed scraper runs failed:", err);
    }

    return NextResponse.json({
      ok: true,
      seeded: true,
      companyId: company.id,
      stats: {
        products: createdProducts.length,
        competitors: createdCompetitors.length,
        competitorProducts: competitorPriceTotals.products,
        competitorPrices: competitorPriceTotals.prices,
        recommendations: recsCreated,
        alerts: alertsCreated,
      },
    });
  } catch (err) {
    console.error("Init user error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
