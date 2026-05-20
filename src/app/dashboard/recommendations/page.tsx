import { requireCompany } from "@/lib/get-company";
import { Header } from "@/components/layout/header";
import { RecommendationsPanel } from "@/components/dashboard/recommendations-panel";
import { ExportButton } from "@/components/ui/export-button";
import { db } from "@/lib/db";

async function getRecommendations() {
  const company = await requireCompany();
  if (!company) return { pending: [], applied: [], totalOpportunity: 0 };

  const [pending, applied] = await Promise.all([
    db.priceRecommendation.findMany({
      where: { companyId: company.id, status: "PENDING" },
      include: {
        product: {
          select: {
            name: true, nameAlbanian: true, brand: true,
            category: true, sku: true, unitLabel: true, currentPrice: true,
          },
        },
      },
      orderBy: [{ confidenceScore: "desc" }, { expectedRevenueDelta: "desc" }],
    }),
    db.priceRecommendation.findMany({
      where: { companyId: company.id, status: "APPLIED" },
      include: {
        product: { select: { name: true, brand: true, category: true, unitLabel: true } },
      },
      orderBy: { appliedAt: "desc" },
      take: 20,
    }),
  ]);

  const totalOpportunity = pending
    .filter((r: { expectedRevenueDelta: number }) => r.expectedRevenueDelta > 0)
    .reduce((sum: number, r: { expectedRevenueDelta: number }) => sum + r.expectedRevenueDelta, 0);

  return { pending, applied, totalOpportunity };
}

export default async function RecommendationsPage() {
  const data = await getRecommendations();

  return (
    <div className="flex flex-col">
      <Header
        title="Rekomandimet e Marzhit AI"
        subtitle={`${data.pending.length} aktive • Mundësi: €${data.totalOpportunity.toFixed(0)}/ditë`}
        actions={<ExportButton type="recommendations" label="Eksporto Excel" />}
      />
      <div className="p-6">
        <RecommendationsPanel
          pending={data.pending}
          applied={data.applied}
          totalOpportunity={data.totalOpportunity}
        />
      </div>
    </div>
  );
}
