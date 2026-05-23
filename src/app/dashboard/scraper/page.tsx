import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { ScraperPanel } from "./scraper-panel";

async function getScraperData(companyId: string) {
  const [runs, companyCompetitors] = await Promise.all([
    db.scraperRun.findMany({
      where: { companyId },
      orderBy: { startedAt: "desc" },
      take: 20,
    }),
    db.companyCompetitor.findMany({
      where: { companyId, isTracked: true },
      include: { competitor: { select: { id: true, name: true } } },
      orderBy: { competitor: { name: "asc" } },
    }),
  ]);

  return {
    runs,
    competitors: companyCompetitors.map((cc) => cc.competitor),
  };
}

export default async function ScraperPage() {
  const company = await requireCompany();
  const { runs, competitors } = company
    ? await getScraperData(company.id)
    : { runs: [], competitors: [] };

  return (
    <div className="flex flex-col">
      <Header
        title="Skanimi i Çmimeve"
        subtitle="Mblidh çmime reale nga konkurrentët — automatikisht, manualisht, ose nëpërmjet CSV"
      />
      <div className="p-6">
        <ScraperPanel initialRuns={runs} competitors={competitors} />
      </div>
    </div>
  );
}
