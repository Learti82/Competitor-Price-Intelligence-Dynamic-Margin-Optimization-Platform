import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ui/export-button";
import { db } from "@/lib/db";
import { ClipboardList, User, Clock } from "lucide-react";

async function getAuditLogs() {
  const company = await db.company.findFirst({
    where: { clerkOrgId: "demo_org_markal" },
  });
  if (!company) return [];

  return db.auditLog.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

const ACTION_LABELS: Record<string, { label: string; variant: "success" | "info" | "warning" | "danger" | "secondary" }> = {
  PRICE_UPDATED: { label: "Çmim i Ndryshuar", variant: "warning" },
  RECOMMENDATION_APPLIED: { label: "Rekomandim i Zbatuar", variant: "success" },
  RECOMMENDATION_DISMISSED: { label: "Rekomandim i Refuzuar", variant: "secondary" },
  COMPETITOR_ADDED: { label: "Konkurrent i Shtuar", variant: "info" },
  PRODUCT_ADDED: { label: "Produkt i Shtuar", variant: "info" },
  STORE_ADDED: { label: "Dyqan i Shtuar", variant: "info" },
};

export default async function AuditPage() {
  const logs = await getAuditLogs();

  return (
    <div className="flex flex-col">
      <Header
        title="Regjistri i Auditimit"
        subtitle={`${logs.length} veprime të regjistruara • Kontabilitet i plotë`}
        actions={<ExportButton type="audit" label="Eksporto Excel" />}
      />
      <div className="p-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-800">
              {logs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] ?? {
                  label: log.action,
                  variant: "secondary" as const,
                };
                return (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-800/30 transition-colors">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-800">
                      <ClipboardList className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={actionInfo.variant} className="text-[10px]">
                          {actionInfo.label}
                        </Badge>
                        <span className="text-xs text-gray-500">{log.entityType}</span>
                        {log.entityId && (
                          <span className="text-xs text-gray-600 font-mono">{log.entityId.slice(-8)}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString("sq-AL")}
                        </span>
                      </div>

                      {(log as any).reason && (
                        <div className="mt-1 text-xs">
                          <span className="text-gray-600">Arsyeja: </span>
                          <span className="text-yellow-400 italic">{(log as any).reason}</span>
                        </div>
                      )}
                      {log.newValue && typeof log.newValue === "object" && (
                        <div className="mt-1 text-xs text-gray-600">
                          {Object.entries(log.newValue as Record<string, unknown>)
                            .slice(0, 3)
                            .map(([k, v]) => (
                              <span key={k} className="mr-3">
                                {k}: <span className="text-gray-400">{String(v)}</span>
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {logs.length === 0 && (
                <div className="flex flex-col items-center py-16 text-gray-500">
                  <ClipboardList className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Nuk ka veprime të regjistruara</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
