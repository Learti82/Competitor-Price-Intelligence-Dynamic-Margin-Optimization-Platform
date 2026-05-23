import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { ScraperPanel } from "./scraper-panel";

async function getScraperRuns(companyId: string) {
  return db.scraperRun.findMany({
    where: { companyId },
    orderBy: { startedAt: "desc" },
    take: 10,
  });
}

export default async function ScraperPage() {
  const company = await requireCompany();
  const runs = company ? await getScraperRuns(company.id) : [];

  return (
    <div className="flex flex-col">
      <Header
        title="Skaneri i Çmimeve"
        subtitle="Përditëso çmimet e konkurrentëve automatikisht"
      />
      <div className="p-6">
        <ScraperPanel initialRuns={runs} />
      </div>
    </div>
  );
}
