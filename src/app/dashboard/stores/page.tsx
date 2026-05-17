import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { regionLabel } from "@/lib/utils";
import { Store, MapPin, Ruler } from "lucide-react";
import { db } from "@/lib/db";

async function getStores() {
  const company = await db.company.findFirst({
    where: { clerkOrgId: "demo_org_markal" },
  });
  if (!company) return [];

  return db.store.findMany({
    where: { companyId: company.id },
    orderBy: [{ region: "asc" }, { name: "asc" }],
  });
}

const STORE_TYPE_LABELS: Record<string, string> = {
  SUPERMARKET: "Supermarket",
  HYPERMARKET: "Hipermarket",
  DISCOUNT: "Discount",
  WHOLESALE: "Shumicë",
  CONVENIENCE: "Konveniencë",
  SPECIALTY: "Specialitet",
};

export default async function StoresPage() {
  const stores = await getStores();

  return (
    <div className="flex flex-col">
      <Header
        title="Rrjeti i Dyqaneve"
        subtitle={`${stores.length} dyqane aktive në ${new Set(stores.map((s) => s.region)).size} rajone`}
      />
      <div className="p-6">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {stores.map((store) => (
            <Card key={store.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                      <Store className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-sm">{store.name}</CardTitle>
                      <p className="text-xs text-gray-500">{store.city}</p>
                    </div>
                  </div>
                  <Badge
                    variant={store.isActive ? "success" : "secondary"}
                    className="text-[10px]"
                  >
                    {store.isActive ? "Aktiv" : "Joaktiv"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="h-3.5 w-3.5 text-gray-600" />
                  <span>{store.address ?? "Adresa e papërcaktuar"}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Ruler className="h-3.5 w-3.5 text-gray-600" />
                    <span>{store.salesFloorM2 ? `${store.salesFloorM2.toLocaleString()} m²` : "—"}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] bg-gray-800 text-gray-400">
                    {STORE_TYPE_LABELS[store.storeType] ?? store.storeType}
                  </Badge>
                </div>
                <div className="pt-2 border-t border-gray-800">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {regionLabel(store.region)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
