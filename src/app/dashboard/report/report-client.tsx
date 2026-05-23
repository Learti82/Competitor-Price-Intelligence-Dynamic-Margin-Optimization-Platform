"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, TrendingDown, AlertTriangle, Printer, ArrowUpRight, BarChart3, Users } from "lucide-react";
import { formatPercent } from "@/lib/utils";

interface ReportData {
  companyName: string;
  period: string;
  generatedAt: string;
  stats: {
    avgMargin: number;
    totalProducts: number;
    belowMinMargin: number;
    pendingRecs: number;
    appliedThisWeek: number;
    appliedRevenue: number;
    unreadAlerts: number;
    highAlerts: number;
  };
  topOpportunities: Array<{ product: string; opportunity: string; action: string }>;
  topRisks: Array<{ product: string; risk: string; severity: "HIGH" | "MEDIUM" }>;
  highAlerts: Array<{ title: string; description: string; severity: string; alertType: string }>;
  categoryBreakdown: Array<{ category: string; label: string; count: number; avgMargin: number }>;
  competitorActivity: Array<{ name: string; changedProducts: number; totalProducts: number }>;
}

export function ReportClient({ data }: { data: ReportData }) {
  function handlePrint() {
    window.print();
  }

  const kpis = [
    {
      label: "Marzhi mesatar",
      value: formatPercent(data.stats.avgMargin),
      sub: `${data.stats.totalProducts} produkte`,
      color: data.stats.avgMargin >= 10 ? "text-emerald-400" : "text-yellow-400",
    },
    {
      label: "Aplikuar këtë javë",
      value: data.stats.appliedThisWeek.toString(),
      sub: `+€${data.stats.appliedRevenue.toFixed(0)} revenue`,
      color: "text-blue-400",
    },
    {
      label: "Njoftime aktive",
      value: data.stats.unreadAlerts.toString(),
      sub: `${data.stats.highAlerts} me prioritet të lartë`,
      color: data.stats.highAlerts > 0 ? "text-red-400" : "text-yellow-400",
    },
    {
      label: "Nën marzhë min.",
      value: data.stats.belowMinMargin.toString(),
      sub: "produkte me rrezik",
      color: data.stats.belowMinMargin > 0 ? "text-red-400" : "text-emerald-400",
    },
  ];

  return (
    <div className="flex flex-col">
      <Header
        title="Raport Javor"
        subtitle={data.period}
        actions={
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-gray-700 text-gray-400 hover:text-white">
            <Printer className="h-4 w-4" /> Printo
          </Button>
        }
      />

      <div className="p-6 space-y-6 max-w-4xl" id="weekly-report">
        {/* Report header banner */}
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Raport Javor i Çmimeve</h2>
                    <p className="text-sm text-blue-300">{data.companyName}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">Periudha: <span className="text-white">{data.period}</span></p>
                <p className="text-xs text-gray-600 mt-0.5">Gjeneruar: {data.generatedAt}</p>
              </div>
              <Badge variant="info" className="text-sm px-3 py-1">PriceSync</Badge>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Treguesit Kryesorë</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-gray-600 mt-1">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Top opportunities */}
        {data.topOpportunities.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Top {data.topOpportunities.length} Mundësi të Kësaj Jave
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.topOpportunities.map((o, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                  <div>
                    <p className="text-sm font-medium text-white">{o.product}</p>
                    <p className="text-xs text-gray-500">{o.action}</p>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold text-sm">
                    <ArrowUpRight className="h-4 w-4" /> {o.opportunity}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Risks */}
        {data.topRisks.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" /> Rreziqet e Marzhit ({data.topRisks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.topRisks.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <div>
                    <p className="text-sm font-medium text-white">{r.product}</p>
                    <p className="text-xs text-gray-500">{r.risk}</p>
                  </div>
                  <Badge variant={r.severity === "HIGH" ? "danger" : "warning"} className="text-[10px]">
                    {r.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Category breakdown */}
        {data.categoryBreakdown.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" /> Marzhet sipas Kategorisë
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="rounded-lg bg-gray-800 p-3 text-center">
                    <p className="text-[10px] text-gray-500 truncate mb-1">{cat.label}</p>
                    <p className={`text-lg font-bold ${cat.avgMargin >= 10 ? "text-emerald-400" : cat.avgMargin >= 5 ? "text-yellow-400" : "text-red-400"}`}>
                      {formatPercent(cat.avgMargin)}
                    </p>
                    <p className="text-[10px] text-gray-600">{cat.count} produkte</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competitor activity */}
        {data.competitorActivity.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" /> Aktiviteti i Konkurrentëve (7 ditë)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.competitorActivity.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                  <p className="text-sm font-medium text-blue-400">{c.name}</p>
                  <div className="text-right">
                    <p className="text-sm text-white font-semibold">{c.changedProducts} ndryshime</p>
                    <p className="text-xs text-gray-500">nga {c.totalProducts} produkte</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-700 pt-4 border-t border-gray-800">
          Gjeneruar automatikisht nga PriceSync Manager • {data.generatedAt}
        </div>
      </div>
    </div>
  );
}
