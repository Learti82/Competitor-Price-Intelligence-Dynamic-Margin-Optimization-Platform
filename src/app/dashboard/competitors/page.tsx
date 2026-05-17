import { Header } from "@/components/layout/header";
import { CompetitorsGrid } from "@/components/dashboard/competitors-grid";
import { db } from "@/lib/db";

async function getCompetitors() {
  const company = await db.company.findFirst({
    where: { clerkOrgId: "demo_org_markal" },
  });
  if (!company) return [];

  const competitors = await db.competitor.findMany({
    include: {
      products: {
        include: {
          prices: { orderBy: { recordedAt: "desc" }, take: 1 },
        },
      },
      companyLinks: { where: { companyId: company.id } },
    },
    orderBy: { numberOfStores: "desc" },
  });

  return competitors.map((c) => {
    const prices = c.products.flatMap((p) => p.prices.map((pr) => pr.price));
    const avgPrice = prices.length
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : null;
    const outOfStock = c.products.filter((p) => !p.isAvailable).length;
    const lastUpdate = c.products
      .flatMap((p) => p.prices.map((pr) => pr.recordedAt))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return {
      id: c.id,
      name: c.name,
      nameAlbanian: c.nameAlbanian,
      slug: c.slug,
      hqCity: c.hqCity,
      numberOfStores: c.numberOfStores,
      pricingStrategy: c.pricingStrategy,
      description: c.description,
      isTracked: c.companyLinks[0]?.isTracked ?? false,
      productCount: c.products.length,
      outOfStockCount: outOfStock,
      avgPrice,
      lastUpdate,
    };
  });
}

export default async function CompetitorsPage() {
  const competitors = await getCompetitors();

  return (
    <div className="flex flex-col">
      <Header
        title="Konkurrentët"
        subtitle={`${competitors.length} zinxhirë të monitoruar në tregun kosovar`}
      />
      <div className="p-6">
        <CompetitorsGrid competitors={competitors} />
      </div>
    </div>
  );
}
