"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Check, X, ChevronRight, Sparkles } from "lucide-react";
import { formatCurrency, formatPercent, categoryLabel } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface Recommendation {
  id: string;
  currentMargin: number;
  recommendedMargin: number;
  currentPrice: number;
  recommendedPrice: number;
  confidenceScore: number;
  expectedRevenueDelta: number;
  rationaleAlbanian: string | null;
  product: {
    name: string;
    brand: string | null;
    category: string;
    unitLabel: string | null;
  };
}

export function TopRecommendations({ recommendations }: { recommendations: Recommendation[] }) {
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = recommendations.filter(
    (r) => !applied.has(r.id) && !dismissed.has(r.id)
  );

  async function handleAction(id: string, action: "APPLY" | "DISMISS") {
    try {
      const res = await fetch("/api/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error("Failed");

      if (action === "APPLY") {
        setApplied((s) => new Set([...s, id]));
        toast.success("Rekomandimi u zbatua me sukses!");
      } else {
        setDismissed((s) => new Set([...s, id]));
        toast.info("Rekomandimi u refuzua.");
      }
    } catch {
      toast.error("Gabim gjatë procesimit.");
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            Rekomandimet AI
          </CardTitle>
          <Link
            href="/dashboard/recommendations"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Shiko të gjitha <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="text-xs text-gray-500">
          Optimizimi i marzhit bazuar në inteligjencën konkurruese
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {visible.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nuk ka rekomandime aktive</p>
          </div>
        )}

        {visible.slice(0, 4).map((rec) => {
          const marginUp = rec.recommendedMargin > rec.currentMargin;
          const marginDelta = rec.recommendedMargin - rec.currentMargin;

          return (
            <div key={rec.id} className="rounded-lg border border-gray-800 bg-gray-800/50 p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">{rec.product.name}</p>
                    {rec.product.unitLabel && (
                      <span className="text-xs text-gray-600">({rec.product.unitLabel})</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{categoryLabel(rec.product.category)}</p>
                </div>
                <Badge variant={marginUp ? "success" : "warning"} className="text-[10px] shrink-0 ml-2">
                  {marginUp ? "▲" : "▼"} {Math.abs(marginDelta).toFixed(1)}pp
                </Badge>
              </div>

              {/* Price & margin comparison */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="rounded-md bg-gray-900 px-2 py-1.5">
                  <p className="text-[10px] text-gray-600">Aktual</p>
                  <p className="text-sm font-semibold text-gray-300">
                    {formatCurrency(rec.currentPrice)}
                  </p>
                  <p className="text-xs text-gray-500">{formatPercent(rec.currentMargin)}</p>
                </div>
                <div className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-1.5">
                  <p className="text-[10px] text-blue-400">Rekomanduar</p>
                  <p className="text-sm font-semibold text-blue-300">
                    {formatCurrency(rec.recommendedPrice)}
                  </p>
                  <p className="text-xs text-blue-400">{formatPercent(rec.recommendedMargin)}</p>
                </div>
              </div>

              {/* Confidence */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-600">Besimi</span>
                  <span className="text-[10px] font-medium text-gray-400">
                    {rec.confidenceScore.toFixed(0)}%
                  </span>
                </div>
                <Progress value={rec.confidenceScore} className="h-1" />
              </div>

              {/* Revenue delta */}
              {rec.expectedRevenueDelta > 0 && (
                <p className="text-xs text-emerald-400 mb-2">
                  +{formatCurrency(rec.expectedRevenueDelta)}/ditë potenciale
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="success"
                  className="h-7 flex-1 text-xs"
                  onClick={() => handleAction(rec.id, "APPLY")}
                >
                  <Check className="h-3 w-3" />
                  Zbato
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 flex-1 text-xs text-gray-500 hover:text-gray-300"
                  onClick={() => handleAction(rec.id, "DISMISS")}
                >
                  <X className="h-3 w-3" />
                  Refuzo
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
