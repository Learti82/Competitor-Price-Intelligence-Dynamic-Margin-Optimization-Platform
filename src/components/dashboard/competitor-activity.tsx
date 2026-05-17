import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Package, AlertCircle } from "lucide-react";

const STRATEGY_LABELS: Record<string, { label: string; color: string }> = {
  EDLP: { label: "EDLP", color: "text-blue-400" },
  HiLo: { label: "Hi-Lo", color: "text-purple-400" },
  DISCOUNT: { label: "Discount", color: "text-green-400" },
  PREMIUM: { label: "Premium", color: "text-yellow-400" },
  CONVENIENCE: { label: "Konv.", color: "text-cyan-400" },
  VALUE: { label: "Vlerë", color: "text-orange-400" },
};

interface Competitor {
  id: string;
  name: string;
  numberOfStores: number;
  pricingStrategy: string | null;
  products: Array<{
    isAvailable: boolean;
    prices: Array<{ price: number; recordedAt: Date }>;
  }>;
}

export function CompetitorActivity({ competitors }: { competitors: Competitor[] }) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-400" />
          Aktiviteti i Konkurrentëve
        </CardTitle>
        <p className="text-xs text-gray-500">Ndryshimet e çmimeve — 24 orët e fundit</p>
      </CardHeader>

      <CardContent className="space-y-2">
        {competitors.map((comp) => {
          const totalProducts = comp.products.length;
          const outOfStock = comp.products.filter((p) => !p.isAvailable).length;
          const recentChanges = comp.products.filter((p) => p.prices.length > 0).length;
          const strategy = STRATEGY_LABELS[comp.pricingStrategy ?? ""] ?? {
            label: comp.pricingStrategy ?? "—",
            color: "text-gray-400",
          };

          return (
            <div
              key={comp.id}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2.5 hover:bg-gray-800/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-700 text-xs font-bold text-white">
                  {comp.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white leading-none">{comp.name.split(" ")[0]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{comp.numberOfStores} dyqane</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${strategy.color}`}>{strategy.label}</span>

                {outOfStock > 0 && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Package className="h-3 w-3" />
                    <span className="text-xs">{outOfStock}</span>
                  </div>
                )}

                {recentChanges > 0 && (
                  <Badge variant="info" className="text-[10px] px-1.5 py-0">
                    {recentChanges} ∆
                  </Badge>
                )}

                {totalProducts === 0 && (
                  <AlertCircle className="h-3.5 w-3.5 text-gray-600" />
                )}
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-600 text-center">
            ∆ = ndryshime çmimi • 📦 = pa stok
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
