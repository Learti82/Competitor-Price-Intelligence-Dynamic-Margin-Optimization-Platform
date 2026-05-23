import {
  PrismaClient,
  KosovoRegion,
  StoreType,
  PriceSource,
  AlertType,
  AlertSeverity,
  UserRole,
  RecommendationStatus,
  PricingRuleType,
  ProductCategory,
} from "@prisma/client";
import {
  SEED_COMPETITORS,
  SEED_PRODUCTS,
  SEED_STORES,
  buildCompetitorPriceSeries,
  buildOwnPriceSeries,
  dailyVolumeForCategory,
  pickN,
  randInt,
} from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PriceSync demo company with full Kosovo retail dataset...\n");

  // Competitors
  console.log("Creating Kosovo competitors...");
  const createdCompetitors = await Promise.all(
    SEED_COMPETITORS.map((c) =>
      prisma.competitor.upsert({
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
      })
    )
  );
  console.log(`  Created ${createdCompetitors.length} competitors\n`);

  // Demo company
  console.log("Creating demo company (MarkAl Group)...");
  const company = await prisma.company.upsert({
    where: { clerkOrgId: "demo_org_markal" },
    update: {},
    create: {
      clerkOrgId: "demo_org_markal",
      name: "MarkAl Group",
      nameAlbanian: "MarkAl Group",
      slug: "markal-group",
      hqCity: "Prishtinë",
      hqAddress: "Rr. Nënë Tereza, Nr. 24, Prishtinë",
      numberOfStores: 8,
      annualRevenue: 45_000_000,
      currency: "EUR",
      country: "XK",
      subscriptionTier: "enterprise",
    },
  });

  await prisma.companyUser.upsert({
    where: { clerkUserId_companyId: { clerkUserId: "demo_user_001", companyId: company.id } },
    update: {},
    create: {
      clerkUserId: "demo_user_001",
      companyId: company.id,
      role: UserRole.ADMIN,
      name: "Arben Krasniqi",
      email: "arben@markal.com",
    },
  });

  // Stores
  console.log("Creating store network...");
  const storeSeeds = SEED_STORES;
  const stores = [];
  for (const s of storeSeeds) {
    const id = `store_${company.id}_${s.region.toLowerCase()}_${s.name.replace(/\s+/g, "_").toLowerCase()}`;
    const store = await prisma.store.upsert({
      where: { id },
      update: {},
      create: {
        id,
        companyId: company.id,
        name: `MarkAl - ${s.name}`,
        city: s.city,
        region: s.region as KosovoRegion,
        address: s.address,
        storeType: s.storeType as StoreType,
        salesFloorM2: s.salesFloorM2,
        isActive: true,
      },
    });
    stores.push(store);
  }
  console.log(`  Created ${stores.length} stores\n`);

  // Track competitors
  for (const comp of createdCompetitors) {
    await prisma.companyCompetitor.upsert({
      where: { companyId_competitorId: { companyId: company.id, competitorId: comp.id } },
      update: {},
      create: { companyId: company.id, competitorId: comp.id, isTracked: true },
    });
  }

  // Products
  console.log(`Creating product catalog (${SEED_PRODUCTS.length} SKUs)...`);
  for (const p of SEED_PRODUCTS) {
    const cogs = parseFloat((p.currentPrice * (0.55 + Math.random() * 0.25)).toFixed(2));
    const margin = ((p.currentPrice - cogs) / p.currentPrice) * 100;
    await prisma.product.upsert({
      where: { companyId_sku: { companyId: company.id, sku: p.sku } },
      update: {},
      create: {
        companyId: company.id,
        sku: p.sku,
        name: p.name,
        nameAlbanian: p.nameAlbanian ?? p.name,
        brand: p.brand,
        category: p.category as ProductCategory,
        unit: p.unit,
        unitSize: p.unitSize,
        unitLabel: p.unitLabel,
        cogs,
        currentPrice: p.currentPrice,
        currentMargin: parseFloat(margin.toFixed(2)),
        minMargin: 2.0,
        maxMargin: p.category === "TOBACCO" ? 20 : p.category === "ALCOHOL" ? 25 : 35,
        isActive: true,
      },
    });
  }
  const createdProducts = await prisma.product.findMany({
    where: { companyId: company.id },
    select: {
      id: true, sku: true, name: true, brand: true, category: true,
      cogs: true, currentPrice: true, currentMargin: true,
      unit: true, unitSize: true, unitLabel: true,
    },
  });
  console.log(`  Created ${createdProducts.length} products\n`);

  // Competitor products + 60-day prices + mappings
  console.log("Seeding competitor product catalogs + 60-day price history...");
  let priceCount = 0;
  let compProdCount = 0;
  for (const product of createdProducts) {
    const numComps = randInt(5, 7);
    const chosenComps = pickN(createdCompetitors, Math.min(numComps, createdCompetitors.length));

    await prisma.competitorProduct.createMany({
      data: chosenComps.map((comp) => ({
        competitorId: comp.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        sku: `${comp.slug.toUpperCase()}-${product.sku}`,
        unit: product.unit,
        unitSize: product.unitSize,
        unitLabel: product.unitLabel,
        isAvailable: Math.random() > 0.08,
        lastSeenAt: new Date(),
      })),
      skipDuplicates: true,
    });
    compProdCount += chosenComps.length;

    const cps = await prisma.competitorProduct.findMany({
      where: { competitorId: { in: chosenComps.map((c) => c.id) }, name: product.name },
      select: { id: true, competitorId: true },
    });

    const allPrices: Array<{
      competitorProductId: string; price: number; isInStock: boolean; isOnPromotion: boolean;
      promotionalPrice: number | null; source: PriceSource; recordedAt: Date;
    }> = [];
    for (const cp of cps) {
      const comp = chosenComps.find((c) => c.id === cp.competitorId);
      const strategy = comp?.pricingStrategy ?? "VALUE";
      const series = buildCompetitorPriceSeries(product.currentPrice, strategy, cp.id);
      allPrices.push(...series.map((s) => ({ ...s, source: PriceSource.MANUAL })));
    }
    if (allPrices.length > 0) {
      await prisma.competitorPrice.createMany({ data: allPrices, skipDuplicates: true });
      priceCount += allPrices.length;
    }

    await prisma.competitorProductMap.createMany({
      data: cps.map((cp) => ({
        productId: product.id,
        competitorProductId: cp.id,
        matchConfidence: 0.92 + Math.random() * 0.08,
        isVerified: Math.random() > 0.3,
      })),
      skipDuplicates: true,
    });
  }
  console.log(`  Created ${compProdCount} competitor products and ${priceCount} price records\n`);

  // Our price history
  console.log("Creating our product price history (60 days)...");
  const defaultStoreId = stores[0]?.id ?? null;
  let ownHistoryCount = 0;
  for (const product of createdProducts) {
    const history = buildOwnPriceSeries(product.id, product.currentPrice, product.cogs, defaultStoreId);
    if (history.length > 0) {
      await prisma.productPrice.createMany({ data: history, skipDuplicates: true });
      ownHistoryCount += history.length;
    }
  }
  console.log(`  Created ${ownHistoryCount} own price points\n`);

  // Recommendations
  console.log("Generating price recommendations...");
  const productSubset = pickN(createdProducts, 40);
  const recs: Array<{
    companyId: string; productId: string; currentPrice: number; currentMargin: number;
    recommendedPrice: number; recommendedMargin: number; confidenceScore: number;
    expectedRevenueDelta: number; rationale: string; rationaleAlbanian: string;
    competitorMinPrice: number; competitorMaxPrice: number; competitorAvgPrice: number;
    expiresAt: Date; status: RecommendationStatus;
  }> = [];
  for (let idx = 0; idx < productSubset.length; idx++) {
    const product = productSubset[idx];
    const mappings = await prisma.competitorProductMap.findMany({
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
      .map((m) => ({ name: m.competitorProduct.competitor.name, price: m.competitorProduct.prices[0]?.price ?? null }))
      .filter((x): x is { name: string; price: number } => x.price !== null);
    if (compPrices.length === 0) continue;

    const compMin = Math.min(...compPrices.map((c) => c.price));
    const compMax = Math.max(...compPrices.map((c) => c.price));
    const compAvg = compPrices.reduce((s, c) => s + c.price, 0) / compPrices.length;

    const ourPrice = product.currentPrice;
    const currentMargin = product.currentMargin;
    let recPrice = ourPrice;
    let confidence = 0.75;
    let direction: "UNDERPRICED" | "LOWMARGIN" | "OVERPRICED" | null = null;
    const bucket = idx % 4;
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
      status: RecommendationStatus.PENDING,
    });
    if (recs.length >= 38) break;
  }
  if (recs.length > 0) await prisma.priceRecommendation.createMany({ data: recs });
  console.log(`  Created ${recs.length} recommendations\n`);

  // Alerts
  console.log("Creating margin alerts...");
  const sampleProducts = pickN(createdProducts, 20);
  const pickComp = () => createdCompetitors[Math.floor(Math.random() * createdCompetitors.length)];
  const alerts: Array<{
    companyId: string; productId?: string; alertType: AlertType; severity: AlertSeverity;
    title: string; titleAlbanian: string; description: string; descriptionAlbanian: string;
    metadata: Record<string, unknown>;
  }> = [];

  for (let i = 0; i < randInt(3, 5); i++) {
    const count = randInt(8, 28);
    const dailyGain = randInt(80, 420);
    alerts.push({
      companyId: company.id,
      alertType: AlertType.MARGIN_OPPORTUNITY,
      severity: AlertSeverity.HIGH,
      title: `Mundësi rritje marzhi: ${count} artikuj`,
      titleAlbanian: `Mundësi rritje marzhi: ${count} artikuj`,
      description: `Mund të rrisni marzhit me 2% në ${count} artikuj. Fitim shtesë i mundshëm: €${dailyGain}/ditë.`,
      descriptionAlbanian: `Mund të rrisni marzhit me 2% në ${count} artikuj. Fitim shtesë i mundshëm: €${dailyGain}/ditë.`,
      metadata: { count, potentialDailyRevenue: dailyGain },
    });
  }
  for (let i = 0; i < randInt(3, 4); i++) {
    const comp = pickComp();
    const prod = sampleProducts[i % sampleProducts.length];
    const pct = randInt(5, 18);
    const oldP = parseFloat((prod.currentPrice * (1 - pct / 100)).toFixed(2));
    alerts.push({
      companyId: company.id, productId: prod.id,
      alertType: AlertType.PRICE_SPIKE, severity: AlertSeverity.MEDIUM,
      title: `${comp.name} rriti çmimin me ${pct}%`,
      titleAlbanian: `${comp.name} rriti çmimin me ${pct}%`,
      description: `${comp.name} rriti çmimin e ${prod.name} nga €${oldP} në €${prod.currentPrice.toFixed(2)}.`,
      descriptionAlbanian: `${comp.name} rriti çmimin e ${prod.name} nga €${oldP} në €${prod.currentPrice.toFixed(2)}.`,
      metadata: { competitor: comp.name, product: prod.name, oldPrice: oldP, newPrice: prod.currentPrice, changePct: pct },
    });
  }
  for (let i = 0; i < randInt(2, 3); i++) {
    const comp = pickComp();
    const prod = sampleProducts[(i + 5) % sampleProducts.length];
    const pct = randInt(8, 20);
    const newP = parseFloat((prod.currentPrice * (1 - pct / 100)).toFixed(2));
    alerts.push({
      companyId: company.id, productId: prod.id,
      alertType: AlertType.PRICE_DROP, severity: AlertSeverity.HIGH,
      title: `${comp.name} uli çmimin me ${pct}%`,
      titleAlbanian: `${comp.name} uli çmimin me ${pct}%`,
      description: `${comp.name} uli çmimin e ${prod.name} në €${newP} (-${pct}%) — mund të humbasim klientë.`,
      descriptionAlbanian: `${comp.name} uli çmimin e ${prod.name} në €${newP} (-${pct}%) — mund të humbasim klientë.`,
      metadata: { competitor: comp.name, product: prod.name, newPrice: newP, changePct: -pct },
    });
  }
  for (let i = 0; i < randInt(1, 2); i++) {
    const prod = sampleProducts[(i + 9) % sampleProducts.length];
    const margin = (1 + Math.random() * 2).toFixed(1);
    alerts.push({
      companyId: company.id, productId: prod.id,
      alertType: AlertType.MARGIN_RISK, severity: AlertSeverity.CRITICAL,
      title: `Marzhi i ${prod.name} ra nën 3%`,
      titleAlbanian: `Marzhi i ${prod.name} ra nën 3%`,
      description: `${prod.name} ka marzh ${margin}% — nën pragun e shëndetshëm.`,
      descriptionAlbanian: `${prod.name} ka marzh ${margin}% — nën pragun e shëndetshëm.`,
      metadata: { product: prod.name, margin: parseFloat(margin) },
    });
  }
  for (let i = 0; i < randInt(2, 3); i++) {
    const comp = pickComp();
    const prod = sampleProducts[(i + 12) % sampleProducts.length];
    alerts.push({
      companyId: company.id, productId: prod.id,
      alertType: AlertType.COMPETITOR_OUT_OF_STOCK, severity: AlertSeverity.LOW,
      title: `${comp.name} pa stok — ${prod.name}`,
      titleAlbanian: `${comp.name} pa stok — ${prod.name}`,
      description: `${comp.name} është pa stok për ${prod.name}. Mundësi për rritje çmimi 5-8%.`,
      descriptionAlbanian: `${comp.name} është pa stok për ${prod.name}. Mundësi për rritje çmimi 5-8%.`,
      metadata: { competitor: comp.name, product: prod.name },
    });
  }
  alerts.push({
    companyId: company.id,
    alertType: AlertType.WEEKLY_SUMMARY, severity: AlertSeverity.LOW,
    title: `Raporti javor i marzhit`,
    titleAlbanian: `Raporti javor i marzhit`,
    description: `Java e kaluar: ${randInt(20, 45)} rekomandime të zbatuara, fitim shtesë €${randInt(8000, 18000)}.`,
    descriptionAlbanian: `Java e kaluar: ${randInt(20, 45)} rekomandime të zbatuara, fitim shtesë €${randInt(8000, 18000)}.`,
    metadata: {},
  });
  for (let i = 0; i < randInt(1, 2); i++) {
    const comp = pickComp();
    const items = randInt(20, 80);
    alerts.push({
      companyId: company.id,
      alertType: AlertType.COMPETITOR_STRATEGY_CHANGE, severity: AlertSeverity.MEDIUM,
      title: `${comp.name} ndërroi strategjinë e çmimit`,
      titleAlbanian: `${comp.name} ndërroi strategjinë e çmimit`,
      description: `${comp.name} ka ndryshuar ${items} çmime në 24 orë të fundit.`,
      descriptionAlbanian: `${comp.name} ka ndryshuar ${items} çmime në 24 orë të fundit.`,
      metadata: { competitor: comp.name, changedItems: items, period: "24h" },
    });
  }
  await prisma.marginAlert.createMany({ data: alerts });
  console.log(`  Created ${alerts.length} alerts\n`);

  // Pricing rules
  console.log("Creating pricing rules...");
  const ruleProducts = pickN(createdProducts, 2);
  await prisma.pricingRule.createMany({
    data: [
      {
        companyId: company.id,
        name: "Mos lejoni Plus Market të jetë -5% nën ne",
        description: "Çmimi ynë duhet të jetë maksimumi 5% mbi Plus Market.",
        ruleType: PricingRuleType.COMPETITOR_BASED,
        competitorId: createdCompetitors.find((c) => c.slug === "plus-market")?.id,
        operator: "BELOW", value: 5, valueType: "PERCENTAGE", isActive: true, priority: 10,
      },
      {
        companyId: company.id,
        name: "Mbrojtje marzhi minimal 5%",
        description: "Asnjë produkt nuk shitet me marzh nën 5%.",
        ruleType: PricingRuleType.MARGIN_PROTECTION,
        operator: "ABOVE", value: 5, valueType: "PERCENTAGE", minMargin: 5, isActive: true, priority: 100,
      },
      {
        companyId: company.id,
        name: "Pijet: marzh i synuar 22%",
        description: "Kategoria BEVERAGES duhet të mbajë marzh mes 20-28%.",
        ruleType: PricingRuleType.CATEGORY_RULE,
        category: ProductCategory.BEVERAGES,
        operator: "BETWEEN", value: 22, valueType: "PERCENTAGE", minMargin: 20, maxMargin: 28,
        isActive: true, priority: 50,
      },
      {
        companyId: company.id,
        name: "Mishi: marzh minimal 12%",
        description: "Kategoria MEAT_POULTRY: marzh minimal për shkak të prishjes.",
        ruleType: PricingRuleType.CATEGORY_RULE,
        category: ProductCategory.MEAT_POULTRY,
        operator: "ABOVE", value: 12, valueType: "PERCENTAGE", minMargin: 12,
        isActive: true, priority: 50,
      },
      {
        companyId: company.id,
        name: ruleProducts[0] ? `Mbroni çmimin e ${ruleProducts[0].name}` : "Mbrojtje produkti kyç",
        description: "Produkt kyç KVI — mos lejoni rritje mbi 2%.",
        ruleType: PricingRuleType.PRODUCT_RULE,
        targetProductId: ruleProducts[0]?.id,
        operator: "BELOW", value: 2, valueType: "PERCENTAGE", isActive: true, priority: 20,
      },
    ],
  });

  // Promotions
  console.log("Creating promotions...");
  const promoProducts = pickN(createdProducts, 4);
  const now = new Date();
  const promos = [];
  if (promoProducts[0]) {
    const start = new Date(now); start.setDate(now.getDate() - 3);
    const end = new Date(now); end.setDate(now.getDate() + 4);
    promos.push({
      companyId: company.id, productId: promoProducts[0].id,
      title: `${promoProducts[0].name} -20%`, description: `Promocion aktiv.`,
      discountType: "PERCENTAGE", discountValue: 20, startDate: start, endDate: end,
      isActive: true, status: "ACTIVE",
    });
  }
  if (promoProducts[1]) {
    const start = new Date(now); start.setDate(now.getDate() + 5);
    const end = new Date(now); end.setDate(now.getDate() + 12);
    promos.push({
      companyId: company.id, productId: promoProducts[1].id,
      title: `${promoProducts[1].name} -15%`, description: `Planifikuar.`,
      discountType: "PERCENTAGE", discountValue: 15, startDate: start, endDate: end,
      isActive: true, status: "SCHEDULED",
    });
  }
  if (promoProducts[2]) {
    const start = new Date(now); start.setDate(now.getDate() + 14);
    const end = new Date(now); end.setDate(now.getDate() + 21);
    promos.push({
      companyId: company.id, productId: promoProducts[2].id,
      title: `${promoProducts[2].name} - Ofertë Speciale`, description: `I ardhshëm.`,
      discountType: "PERCENTAGE", discountValue: 25, startDate: start, endDate: end,
      isActive: true, status: "SCHEDULED",
    });
  }
  if (promoProducts[3]) {
    const start = new Date(now); start.setDate(now.getDate() - 20);
    const end = new Date(now); end.setDate(now.getDate() - 10);
    promos.push({
      companyId: company.id, productId: promoProducts[3].id,
      title: `${promoProducts[3].name} -10% (përfunduar)`, description: `Të dhëna ROI.`,
      discountType: "PERCENTAGE", discountValue: 10, startDate: start, endDate: end,
      isActive: false, status: "COMPLETED",
    });
  }
  await prisma.promotion.createMany({ data: promos });

  // Audit log
  console.log("Creating audit log entries...");
  const auditEntries = [
    { action: "PRICE_UPDATED", entityType: "Product", newValue: { product: "Coca-Cola 2L", oldPrice: 1.45, newPrice: 1.50 } },
    { action: "RECOMMENDATION_APPLIED", entityType: "PriceRecommendation", newValue: { product: "Kafe Bona 250g", marginIncrease: 1.8 } },
    { action: "PRODUCT_CREATED", entityType: "Product", newValue: { product: "Nivea krem fytyre 50ml" } },
    { action: "PROMOTION_LAUNCHED", entityType: "Promotion", newValue: { title: "Coca-Cola -20%" } },
    { action: "RULE_UPDATED", entityType: "PricingRule", newValue: { name: "Mbrojtje marzhi minimal 5%" } },
    { action: "RECOMMENDATION_DISMISSED", entityType: "PriceRecommendation", newValue: { product: "Pampers 5", reason: "Furnitori po negocion" } },
    { action: "COMPETITOR_TRACKED", entityType: "Competitor", newValue: { competitor: "Interex" } },
    { action: "BULK_PRICE_UPDATE", entityType: "Product", newValue: { count: 14, category: "DAIRY" } },
  ];
  await prisma.auditLog.createMany({
    data: auditEntries.map((a, idx) => {
      const ts = new Date(); ts.setHours(ts.getHours() - idx * 3);
      return { companyId: company.id, userId: "demo_user_001", userName: "Arben Krasniqi", ...a, createdAt: ts };
    }),
  });

  // Scraper runs
  console.log("Creating scraper runs...");
  const recentDone = new Date(); recentDone.setHours(recentDone.getHours() - 1);
  const earlierDone = new Date(); earlierDone.setHours(earlierDone.getHours() - 8);
  const running = new Date(); running.setMinutes(running.getMinutes() - 2);
  await prisma.scraperRun.createMany({
    data: [
      {
        companyId: company.id, status: "COMPLETED",
        itemsScraped: randInt(800, 1400),
        log: ["Starting scrape", "Plus Market: 312 items", "Viva Fresh: 287 items", "Bucaj: 198 items", "Completed"],
        startedAt: new Date(recentDone.getTime() - 7 * 60 * 1000), completedAt: recentDone,
      },
      {
        companyId: company.id, status: "COMPLETED",
        itemsScraped: randInt(700, 1200),
        log: ["Starting scrape", "Maxi: 245 items", "Interex: 198 items", "Conad: 167 items", "Completed"],
        startedAt: new Date(earlierDone.getTime() - 9 * 60 * 1000), completedAt: earlierDone,
      },
      {
        companyId: company.id, status: "RUNNING",
        itemsScraped: randInt(50, 200),
        log: ["Starting scrape", "ICA Grup: in progress..."],
        startedAt: running,
      },
    ],
  });

  console.log("\nSeed complete! Demo data ready.");
  console.log(`
  Summary:
    - ${createdCompetitors.length} competitors
    - ${stores.length} stores
    - ${createdProducts.length} products
    - ${compProdCount} competitor products
    - ${priceCount} competitor price records
    - ${ownHistoryCount} own price history records
    - ${recs.length} recommendations
    - ${alerts.length} alerts
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
