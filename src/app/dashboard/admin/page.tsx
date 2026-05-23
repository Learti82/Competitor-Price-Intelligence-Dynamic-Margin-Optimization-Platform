import { requireCompany } from "@/lib/get-company";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Building2, Users, Package } from "lucide-react";

async function getAllCompanies() {
  return db.company.findMany({
    include: {
      users: true,
      products: { where: { isActive: true } },
      _count: {
        select: {
          products: true,
          priceRecommendations: true,
          marginAlerts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

const TIER_STYLES: Record<string, string> = {
  starter: "bg-gray-700 text-gray-300 border-gray-600",
  pro: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  enterprise: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default async function AdminPage() {
  await requireCompany();
  const companies = await getAllCompanies();

  const totalCompanies = companies.length;
  const totalProducts = companies.reduce((acc, c) => acc + c._count.products, 0);
  const totalUsers = companies.reduce((acc, c) => acc + c.users.length, 0);

  return (
    <div className="flex flex-col">
      <Header
        title="Paneli i Administratorit"
        subtitle="Të gjitha kompanitë në platformë"
      />
      <div className="p-6 space-y-6">
        {/* Notice */}
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-300">
          Ky panel është vetëm për administratorët e platformës.
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalCompanies}</p>
                <p className="text-xs text-gray-400">Kompani Totale</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Package className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalProducts}</p>
                <p className="text-xs text-gray-400">Produkte Totale</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalUsers}</p>
                <p className="text-xs text-gray-400">Përdorues Totale</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Të gjitha Kompanitë</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500">
                    <th className="text-left py-2 pr-4">Kompania</th>
                    <th className="text-left py-2 pr-4">Qyteti</th>
                    <th className="text-left py-2 pr-4">Përdorues</th>
                    <th className="text-left py-2 pr-4">Produkte Aktive</th>
                    <th className="text-left py-2 pr-4">Tier</th>
                    <th className="text-left py-2 pr-4">U krijua</th>
                    <th className="text-left py-2">Clerk ID</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-b border-gray-800/50 last:border-0">
                      <td className="py-3 pr-4 text-white font-semibold text-xs">{company.name}</td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">{company.hqCity}</td>
                      <td className="py-3 pr-4 text-gray-300 text-xs">{company.users.length}</td>
                      <td className="py-3 pr-4 text-gray-300 text-xs">{company.products.length}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${TIER_STYLES[company.subscriptionTier] ?? "bg-gray-700 text-gray-400 border-gray-600"}`}>
                          {company.subscriptionTier}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">
                        {format(new Date(company.createdAt), "dd/MM/yyyy")}
                      </td>
                      <td className="py-3 text-gray-600 text-[10px] font-mono truncate max-w-[140px]">
                        {company.clerkOrgId.slice(0, 20)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {companies.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">Nuk ka kompani ende.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
