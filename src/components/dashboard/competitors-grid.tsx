"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { Store, Package, AlertCircle, Clock, TrendingUp } from "lucide-react";

const STRATEGY_INFO: Record<string, { label: string; color: string; desc: string }> = {
  EDLP: { label: "EDLP", color: "text-blue-400 bg-blue-500/10", desc: "Çmime të ulëta çdo ditë" },
  HiLo: { label: "Hi-Lo", color: "text-purple-400 bg-purple-500/10", desc: "Bazë e lartë + promocione" },
  DISCOUNT: { label: "Discount", color: "text-green-400 bg-green-500/10", desc: "Çmime agresive të ulëta" },
  PREMIUM: { label: "Premium", color: "text-yellow-400 bg-yellow-500/10", desc: "Segment i lartë, importime" },
  CONVENIENCE: { label: "Konveniencë", color: "text-cyan-400 bg-cyan-500/10", desc: "Lokacion + çmim mbi mesatare" },
  VALUE: { label: "Vlerë", color: "text-orange-400 bg-orange-500/10", desc: "Vlerë e mirë për çmimin" },
};

interface Competitor {
  id: string;
  name: string;
  slug: string;
  hqCity: string;
  numberOfStores: number;
  pricingStrategy: string | null;
  description: string | null;
  isTracked: boolean;
  productCount: number;
  outOfStockCount: number;
  avgPrice: number | null;
  lastUpdate: Date | null;
}

export function CompetitorsGrid({ competitors }: { competitors: Competitor[] }) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      {competitors.map((comp) => {
        const strategy = STRATEGY_INFO[comp.pricingStrategy ?? ""] ?? {
          label: comp.pricingStrategy ?? "E panjohur",
          color: "text-gray-400 bg-gray-800",
          desc: "",
        };

        const initials = comp.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

        return (
          <Card key={comp.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 text-base font-bold text-white border border-gray-700">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{comp.name}</h3>
                    <p className="text-xs text-gray-500">{comp.hqCity}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {comp.isTracked ? (
                    <Badge variant="success" className="text-[10px]">Aktiv</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Joaktiv</Badge>
                  )}
                  {comp.outOfStockCount > 0 && (
                    <Badge variant="warning" className="text-[10px]">
                      {comp.outOfStockCount} pa stok
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Strategy */}
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${strategy.color}`}>
                <TrendingUp className="h-3 w-3" />
                {strategy.label}
                {strategy.desc && <span className="opacity-60">· {strategy.desc}</span>}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center rounded-lg bg-gray-800 p-2.5">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Store className="h-3 w-3 text-gray-500" />
                  </div>
                  <p className="text-lg font-bold text-white">{comp.numberOfStores}</p>
                  <p className="text-[10px] text-gray-600">Dyqane</p>
                </div>
                <div className="text-center rounded-lg bg-gray-800 p-2.5">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Package className="h-3 w-3 text-gray-500" />
                  </div>
                  <p className="text-lg font-bold text-white">{comp.productCount}</p>
                  <p className="text-[10px] text-gray-600">Produkte</p>
                </div>
                <div className="text-center rounded-lg bg-gray-800 p-2.5">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AlertCircle className="h-3 w-3 text-gray-500" />
                  </div>
                  <p className={`text-lg font-bold ${comp.outOfStockCount > 0 ? "text-yellow-400" : "text-white"}`}>
                    {comp.outOfStockCount}
                  </p>
                  <p className="text-[10px] text-gray-600">Pa stok</p>
                </div>
              </div>

              {/* Avg price & last update */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-800">
                <span>
                  {comp.avgPrice
                    ? `Çmimi mesatar: ${formatCurrency(comp.avgPrice)}`
                    : "Pa të dhëna çmimi"}
                </span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {comp.lastUpdate ? timeAgo(comp.lastUpdate) : "Asnjëherë"}
                </div>
              </div>

              {/* Description */}
              {comp.description && (
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {comp.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
