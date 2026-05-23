import { requireCompany } from "@/lib/get-company";
import { Header } from "@/components/layout/header";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { db } from "@/lib/db";

async function getAlerts() {
  const company = await requireCompany();
  if (!company) return [];

  return db.marginAlert.findMany({
    where: { companyId: company.id },
    include: {
      product: { select: { name: true, sku: true, category: true } },
    },
    orderBy: [{ isRead: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
  });
}

export default async function AlertsPage() {
  const alerts = await getAlerts();
  const unreadCount = alerts.filter((a: { isRead: boolean }) => !a.isRead).length;

  return (
    <div className="flex flex-col">
      <Header
        title="Njoftimet"
        subtitle={`${unreadCount} të palexuara • ${alerts.length} gjithsej`}
      />
      <div className="p-6">
        <AlertsPanel alerts={alerts} />
      </div>
    </div>
  );
}
