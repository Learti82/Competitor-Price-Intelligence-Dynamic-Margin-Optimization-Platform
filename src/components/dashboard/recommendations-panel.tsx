"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatPercent, categoryLabel } from "@/lib/utils";
import { Check, X, Sparkles, TrendingUp, Euro, Info } from "lucide-react";
import { toast } from "sonner";

interface Recommendation {
  id: string;
  currentMargin: number;
  recommendedMargin: number;
  currentPrice: number;
  recommendedPrice: number;
  confidenceScore: number;
  expectedRevenueDelta: number;
  rationale: string;
  rationaleAlbanian: string | null;
  competitorMinPrice: number | null;
  competitorMaxPrice: number | null;
  competitorAvgPrice: number | null;
  product: {
    name: string;
    brand: string | null;
    category: string;
    unitLabel: string | null;
    sku?: string;
  };
  appliedAt?: Date | null;
}

interface Props {
  pending: Recommendation[];
  applied: Recommendation[];
  totalOpportunity: number;
}

export function RecommendationsPanel({ pending, applied, totalOpportunity }: Props) {
  const [localPending, setLocalPending] = useState(pending);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleAction(id: string, action: "APPLY" | "DISMISS") {
    try {
      const res = await fetch("/api/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error("Failed");

      setLocalPending((prev) => prev.filter((r) => r.id !== id));

      if (action === "APPLY") {
        toast.success("Çmimi u ndryshua me sukses!", {
          description: "Ndryshimi u regjistrua në regjistrin e auditimit.",
        });
      } else {
        toast.info("Rekomandimi u refuzua.");
      }
    } catch {
      toast.error("Gabim gjatë procesimit.");
    }
  }

  async function applyAll() {
    const highConfidence = localPending.filter((r) => r.confidenceScore >= 85);
    for (const rec of highConfidence) {
      await handleAction(rec.id, "APPLY");
    }
    toast.success(`U zbatuan ${highConfidence.length} rekomandime me besim ≥85%!`);
  }

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <Sparkles className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Motor i Optimizimit AI</h3>
              <p className="text-sm text-gray-400">
                {localPending.length} rekomandime aktive •{" "}
                <span className="text-emerald-400 font-medium">
                  {formatCurrency(totalOpportunity)}/ditë mundësi
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="success"
              onClick={applyAll}
              disabled={localPending.filter((r) => r.confidenceScore >= 85).length === 0}
            >
              <Check className="h-4 w-4" />
              Zbato të gjitha (besim ≥85%)
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3 text-xs text-gray-500 flex items-start gap-2">
        <span className="text-blue-400 mt-0.5">ℹ</span>
        <span>
          <strong className="text-gray-400">Si funksionon:</strong> Motori AI analizon çmimet e konkurrentëve dhe COGS-in tuaj çdo ditë.{" "}
          Kur gjen mundësi optimizimi (p.sh. jemi 8% nën çmimin e tregut), gjeneron rekomandim me nivel besueshmërie.{" "}
          Klikoni <strong className="text-gray-400">&quot;Zbato Çmimin&quot;</strong> për ta aplikuar direkt, ose <strong className="text-gray-400">&quot;Refuzo&quot;</strong> nëse nuk pajtoheni.
        </span>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="pending" className="data-[state=active]:bg-gray-700">
            Aktive ({localPending.length})
          </TabsTrigger>
          <TabsTrigger value="applied" className="data-[state=active]:bg-gray-700">
            Të zbatuar ({applied.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {localPending.length === 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="flex flex-col items-center py-16 text-gray-500">
                <TrendingUp className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Nuk ka rekomandime aktive</p>
                <p className="text-sm mt-1">Rekomandimet e reja do të gjenerohen automatikisht.</p>
              </CardContent>
            </Card>
          )}

          {localPending.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const marginUp = rec.recommendedMargin > rec.currentMargin;
            const marginDelta = rec.recommendedMargin - rec.currentMargin;

            return (
              <Card key={rec.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Confidence circle */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-full border-2 text-sm font-bold"
                        style={{
                          borderColor:
                            rec.confidenceScore >= 85
                              ? "#10b981"
                              : rec.confidenceScore >= 70
                              ? "#f59e0b"
                              : "#6b7280",
                          color:
                            rec.confidenceScore >= 85
                              ? "#10b981"
                              : rec.confidenceScore >= 70
                              ? "#f59e0b"
                              : "#9ca3af",
                        }}
                      >
                        {rec.confidenceScore.toFixed(0)}%
                      </div>
                      <span className="text-[10px] text-gray-600">besim</span>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{rec.product.name}</h4>
                          <p className="text-xs text-gray-500">
                            {rec.product.brand && `${rec.product.brand} • `}
                            {categoryLabel(rec.product.category)}
                            {rec.product.unitLabel && ` • ${rec.product.unitLabel}`}
                          </p>
                        </div>
                        <Badge
                          variant={marginUp ? "success" : "warning"}
                          className="shrink-0 text-sm px-2.5 py-1"
                        >
                          {marginUp ? "▲" : "▼"} {Math.abs(marginDelta).toFixed(1)}pp
                        </Badge>
                      </div>

                      {/* Prices comparison */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="rounded-lg bg-gray-800 p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">Çmimi Aktual</p>
                          <p className="font-bold text-white">{formatCurrency(rec.currentPrice)}</p>
                          <p className="text-xs text-gray-400">{formatPercent(rec.currentMargin)}</p>
                        </div>
                        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-center">
                          <p className="text-xs text-blue-400 mb-1">Çmimi Rekomanduar</p>
                          <p className="font-bold text-blue-300">{formatCurrency(rec.recommendedPrice)}</p>
                          <p className="text-xs text-blue-400">{formatPercent(rec.recommendedMargin)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-800 p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">Konkurrentët</p>
                          <p className="font-bold text-gray-300">
                            {rec.competitorAvgPrice
                              ? formatCurrency(rec.competitorAvgPrice)
                              : "—"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {rec.competitorMinPrice && rec.competitorMaxPrice
                              ? `${formatCurrency(rec.competitorMinPrice)}–${formatCurrency(rec.competitorMaxPrice)}`
                              : "mesatare"}
                          </p>
                        </div>
                      </div>

                      {/* Revenue delta */}
                      {rec.expectedRevenueDelta > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <Euro className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm text-emerald-400 font-medium">
                            +{formatCurrency(rec.expectedRevenueDelta)}/ditë e mundshme
                          </span>
                        </div>
                      )}

                      {/* Rationale */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-3"
                      >
                        <Info className="h-3 w-3" />
                        {isExpanded ? "Fshih arsyetimin" : "Shiko arsyetimin AI"}
                      </button>

                      {isExpanded && (
                        <div className="mb-3 rounded-lg bg-gray-800 border border-gray-700 p-3 text-xs text-gray-300 leading-relaxed">
                          {rec.rationaleAlbanian}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          className="flex-1"
                          onClick={() => handleAction(rec.id, "APPLY")}
                        >
                          <Check className="h-4 w-4" />
                          Zbato Çmimin
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 text-gray-500 hover:text-gray-300 border border-gray-700"
                          onClick={() => handleAction(rec.id, "DISMISS")}
                        >
                          <X className="h-4 w-4" />
                          Refuzo
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="applied" className="space-y-3 mt-4">
          {applied.map((rec) => (
            <Card key={rec.id} className="bg-gray-900 border-gray-800 opacity-70">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{rec.product.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(rec.currentPrice)} → {formatCurrency(rec.recommendedPrice)}
                    {" "}({formatPercent(rec.currentMargin)} → {formatPercent(rec.recommendedMargin)})
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="success" className="mb-1">U zbatua</Badge>
                  <p className="text-xs text-gray-600">
                    {rec.appliedAt ? new Date(rec.appliedAt).toLocaleDateString("sq-AL") : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
