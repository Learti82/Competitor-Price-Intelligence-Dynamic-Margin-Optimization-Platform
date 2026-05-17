/**
 * PriceSync Margin Optimization Engine
 * Heuristic-based margin optimizer for Kosovo retail market.
 */

export interface MarginInputs {
  productName: string;
  category: string;
  cogs: number;
  currentPrice: number;
  currentMargin: number;
  minMargin: number;
  maxMargin: number;
  competitorPrices: number[];
  isCompetitorOutOfStock?: boolean;
  regionDemandMultiplier?: number; // 1.0 baseline, >1 high demand
  stockLevel?: "LOW" | "MEDIUM" | "HIGH";
  isPeakHour?: boolean;
  historicalElasticity?: number; // demand drop % per 1% price increase
}

export interface MarginRecommendation {
  recommendedPrice: number;
  recommendedMargin: number;
  confidenceScore: number;
  expectedRevenueDelta: number;
  competitorMinPrice: number;
  competitorMaxPrice: number;
  competitorAvgPrice: number;
  rationale: string;
  rationaleAlbanian: string;
  factors: RecommendationFactor[];
}

export interface RecommendationFactor {
  name: string;
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  weight: number;
  description: string;
}

const CATEGORY_ELASTICITY: Record<string, number> = {
  BEVERAGES: 1.8,
  DAIRY: 1.2,
  MEAT_POULTRY: 1.5,
  FRUITS_VEGETABLES: 2.0,
  BAKERY: 0.8,
  FROZEN: 1.4,
  SNACKS_CONFECTIONERY: 1.6,
  PERSONAL_CARE: 0.9,
  HOUSEHOLD: 1.0,
  COFFEE_TEA: 0.7,
  PASTA_GRAINS: 1.1,
  OILS_FATS: 1.3,
  CONDIMENTS: 0.6,
  CANNED_GOODS: 1.0,
  CLEANING: 0.8,
  ALCOHOL: 0.5,
  TOBACCO: 0.3,
  BABY: 0.4,
  PET: 0.7,
  DELI: 1.2,
};

export function optimizeMargin(inputs: MarginInputs): MarginRecommendation {
  const {
    productName,
    category,
    cogs,
    currentPrice,
    currentMargin,
    minMargin,
    maxMargin,
    competitorPrices,
    isCompetitorOutOfStock = false,
    regionDemandMultiplier = 1.0,
    stockLevel = "MEDIUM",
    isPeakHour = false,
    historicalElasticity,
  } = inputs;

  const validPrices = competitorPrices.filter((p) => p > 0);
  const compMin = validPrices.length ? Math.min(...validPrices) : currentPrice;
  const compMax = validPrices.length ? Math.max(...validPrices) : currentPrice;
  const compAvg =
    validPrices.length
      ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length
      : currentPrice;

  const elasticity =
    historicalElasticity ?? CATEGORY_ELASTICITY[category] ?? 1.2;
  const factors: RecommendationFactor[] = [];
  let confidenceScore = 70;
  let targetMarginAdjustment = 0;

  // Factor 1: Competitor pricing position
  const priceVsCompAvg = ((currentPrice - compAvg) / compAvg) * 100;
  if (priceVsCompAvg < -5) {
    // We're cheaper than average — safe room to increase
    const room = Math.min((-priceVsCompAvg - 5) * 0.4, 3.0);
    targetMarginAdjustment += room;
    factors.push({
      name: "Pozita ndaj konkurrentëve",
      impact: "POSITIVE",
      weight: 0.35,
      description: `Çmimi juaj është ${Math.abs(priceVsCompAvg).toFixed(1)}% nën mesataren e konkurrentëve. Hapësirë për rritje marzhi.`,
    });
    confidenceScore += 10;
  } else if (priceVsCompAvg > 5) {
    // We're pricier than average — risky
    const penalty = Math.min((priceVsCompAvg - 5) * 0.3, 2.5);
    targetMarginAdjustment -= penalty;
    factors.push({
      name: "Pozita ndaj konkurrentëve",
      impact: "NEGATIVE",
      weight: 0.35,
      description: `Çmimi juaj është ${priceVsCompAvg.toFixed(1)}% mbi mesataren. Rrezik i humbjes së klientëve.`,
    });
    confidenceScore -= 5;
  } else {
    factors.push({
      name: "Pozita ndaj konkurrentëve",
      impact: "NEUTRAL",
      weight: 0.35,
      description: `Çmimi juaj është konkurrues (brenda 5% nga mesatarja e tregut).`,
    });
  }

  // Factor 2: Competitor out-of-stock (market opportunity)
  if (isCompetitorOutOfStock) {
    targetMarginAdjustment += 1.5;
    factors.push({
      name: "Mundësi tregu",
      impact: "POSITIVE",
      weight: 0.2,
      description: `Konkurrenti kryesor është pa stok. Mundësi e shkëlqyer për rritje çmimi.`,
    });
    confidenceScore += 12;
  }

  // Factor 3: Regional demand multiplier
  if (regionDemandMultiplier > 1.15) {
    const boost = (regionDemandMultiplier - 1) * 3;
    targetMarginAdjustment += boost;
    factors.push({
      name: "Kërkesa rajonale",
      impact: "POSITIVE",
      weight: 0.15,
      description: `Kërkesa rajonale ${((regionDemandMultiplier - 1) * 100).toFixed(0)}% mbi normalen.`,
    });
    confidenceScore += 5;
  } else if (regionDemandMultiplier < 0.85) {
    const drag = (1 - regionDemandMultiplier) * 2;
    targetMarginAdjustment -= drag;
    factors.push({
      name: "Kërkesa rajonale",
      impact: "NEGATIVE",
      weight: 0.15,
      description: `Kërkesa rajonale e ulët. Rekomandohet ruajtja e çmimit konkurrues.`,
    });
  }

  // Factor 4: Stock level
  if (stockLevel === "HIGH") {
    targetMarginAdjustment -= 0.5;
    factors.push({
      name: "Niveli i stokut",
      impact: "NEGATIVE",
      weight: 0.1,
      description: `Stok i lartë — presion për shitje më të shpejta.`,
    });
  } else if (stockLevel === "LOW") {
    targetMarginAdjustment += 0.8;
    factors.push({
      name: "Niveli i stokut",
      impact: "POSITIVE",
      weight: 0.1,
      description: `Stok i ulët — mundësi për çmim premium.`,
    });
  }

  // Factor 5: Peak hours
  if (isPeakHour) {
    targetMarginAdjustment += 0.3;
    factors.push({
      name: "Orë kulmore",
      impact: "POSITIVE",
      weight: 0.1,
      description: `Orë me trafik të lartë — elasticitet i reduktuar.`,
    });
    confidenceScore += 3;
  }

  // Factor 6: Demand elasticity penalty
  if (targetMarginAdjustment > 0 && elasticity > 1.5) {
    const elasticityPenalty = (elasticity - 1.5) * 0.4;
    targetMarginAdjustment -= elasticityPenalty;
    factors.push({
      name: "Elasticiteti i kërkesës",
      impact: "NEGATIVE",
      weight: 0.1,
      description: `Produkt me elasticitet të lartë (${elasticity.toFixed(1)}). Rritja e çmimit mund të zvogëlojë kërkesën.`,
    });
  }

  // Compute recommended margin
  let recommendedMargin = currentMargin + targetMarginAdjustment;
  recommendedMargin = Math.max(minMargin, Math.min(maxMargin, recommendedMargin));

  // Compute price
  const recommendedPrice = cogs / (1 - recommendedMargin / 100);

  // Confidence: add data richness bonus
  if (validPrices.length >= 3) confidenceScore += 8;
  if (validPrices.length >= 5) confidenceScore += 5;
  confidenceScore = Math.min(98, Math.max(40, confidenceScore));

  // Expected revenue delta (rough estimate: 1 unit/day baseline)
  const dailyUnits = stockLevel === "HIGH" ? 15 : stockLevel === "LOW" ? 5 : 10;
  const demandChangeFromPriceChange =
    ((recommendedPrice - currentPrice) / currentPrice) * elasticity * dailyUnits;
  const revenueAtOld = currentPrice * dailyUnits;
  const revenueAtNew = recommendedPrice * Math.max(1, dailyUnits - demandChangeFromPriceChange);
  const expectedRevenueDelta = revenueAtNew - revenueAtOld;

  // Build rationale
  const direction =
    recommendedMargin > currentMargin ? "rritje" : recommendedMargin < currentMargin ? "ulje" : "ruajtje";
  const marginDelta = Math.abs(recommendedMargin - currentMargin);

  const rationale = buildRationale(
    productName,
    currentMargin,
    recommendedMargin,
    direction,
    marginDelta,
    confidenceScore,
    factors,
    compAvg,
    currentPrice,
    "en"
  );

  const rationaleAlbanian = buildRationale(
    productName,
    currentMargin,
    recommendedMargin,
    direction,
    marginDelta,
    confidenceScore,
    factors,
    compAvg,
    currentPrice,
    "sq"
  );

  return {
    recommendedPrice,
    recommendedMargin,
    confidenceScore,
    expectedRevenueDelta,
    competitorMinPrice: compMin,
    competitorMaxPrice: compMax,
    competitorAvgPrice: compAvg,
    rationale,
    rationaleAlbanian,
    factors,
  };
}

function buildRationale(
  productName: string,
  currentMargin: number,
  recommendedMargin: number,
  direction: string,
  marginDelta: number,
  confidence: number,
  factors: RecommendationFactor[],
  compAvg: number,
  currentPrice: number,
  lang: "en" | "sq"
): string {
  const positiveFactors = factors.filter((f) => f.impact === "POSITIVE");
  const negativeFactors = factors.filter((f) => f.impact === "NEGATIVE");

  if (lang === "sq") {
    const actionVerb =
      direction === "rritje" ? "rrisni" : direction === "ulje" ? "ulni" : "mbani";
    let text = `Motori PriceSync rekomandon ${direction} të marzhit nga ${currentMargin.toFixed(1)}% në ${recommendedMargin.toFixed(1)}% (${actionVerb} me ${marginDelta.toFixed(1)} pikë bazë). Besimi: ${confidence.toFixed(0)}%.`;
    if (positiveFactors.length) {
      text += ` Faktorët pozitivë: ${positiveFactors.map((f) => f.description).join("; ")}.`;
    }
    if (negativeFactors.length) {
      text += ` Kujdes: ${negativeFactors.map((f) => f.description).join("; ")}.`;
    }
    return text;
  }

  const actionVerb =
    direction === "rritje" ? "increase" : direction === "ulje" ? "decrease" : "maintain";
  let text = `PriceSync recommends a ${marginDelta.toFixed(1)}pp margin ${direction === "ruajtje" ? "hold" : actionVerb} from ${currentMargin.toFixed(1)}% to ${recommendedMargin.toFixed(1)}%. Confidence: ${confidence.toFixed(0)}%.`;
  if (positiveFactors.length) {
    text += ` Supporting factors: ${positiveFactors.map((f) => f.description).join("; ")}.`;
  }
  if (negativeFactors.length) {
    text += ` Risks: ${negativeFactors.map((f) => f.description).join("; ")}.`;
  }
  return text;
}

export function batchOptimize(
  products: Array<{
    id: string;
    name: string;
    category: string;
    cogs: number;
    currentPrice: number;
    currentMargin: number;
    minMargin: number;
    maxMargin: number;
    competitorPrices: number[];
  }>
): Array<{ id: string } & MarginRecommendation> {
  return products.map((p) => ({
    id: p.id,
    ...optimizeMargin({
      productName: p.name,
      category: p.category,
      cogs: p.cogs,
      currentPrice: p.currentPrice,
      currentMargin: p.currentMargin,
      minMargin: p.minMargin,
      maxMargin: p.maxMargin,
      competitorPrices: p.competitorPrices,
    }),
  }));
}
