"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, TrendingDown, AlertTriangle, Download, Printer, ArrowUpRight, BarChart3 } from "lucide-react";
import { format } from "date-fns";

const REPORT_DATA = {
  period: "13 Maj – 20 Maj 2026",
  company: "MarkAl Group",
  generatedAt: "20 Maj 2026, 08:00",
  kpis: [
    { label: "Marzhi mesatar", value: "14.2%", delta: "+1.1%", up: true },
    { label: "Rekomandimet e aplikuara", value: "12", delta: "+8 nga java kaluar", up: true },
    { label: "Njoftimet aktive", value: "6", delta: "-3 nga java kaluar", up: true },
    { label: "Produktet nën marzhë min.", value: "4", delta: "+2 nga java kaluar", up: false },
  ],
  topOpportunities: [
    { product: "Kafe Bona 200g", opportunity: "+€4.20/ditë", action: "Rrit çmimin me 4%" },
    { product: "Sapun Dove 90g", opportunity: "+€2.80/ditë", action: "Rrit çmimin me 6%" },
    { product: "Çaj Lipton 25 qese", opportunity: "+€1.90/ditë", action: "Rrit çmimin me 3%" },
  ],
  topRisks: [
    { product: "Sheqer 1kg", risk: "Marzhi 3.2% (nën minimum)", severity: "HIGH" },
    { product: "Miell 1kg", risk: "Marzhi 4.8% (afër kufirit)", severity: "MEDIUM" },
  ],
  competitorMoves: [
    { competitor: "Neptuni", action: "Uli çmimet e bulmetit -5%", impact: "Mesatar" },
    { competitor: "Interex", action: "Aksion i ri pijeve gazuese", impact: "I ulët" },
    { competitor: "Viva Fresh", action: "Hapi dyqan të ri në Prizren", impact: "I lartë" },
  ],
};

export default function ReportPage() {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Raport Javor"
        subtitle={REPORT_DATA.period}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-gray-700 text-gray-400 hover:text-white">
              <Printer className="h-4 w-4" /> Printo
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 max-w-4xl" id="weekly-report">
        {/* Report header */}
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
                    <p className="text-sm text-blue-300">{REPORT_DATA.company}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">Periudha: <span className="text-white">{REPORT_DATA.period}</span></p>
                <p className="text-xs text-gray-600 mt-0.5">Gjeneruar: {REPORT_DATA.generatedAt}</p>
              </div>
              <Badge variant="info" className="text-sm px-3 py-1">AI-gjeneruar</Badge>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Treguesit Kryesorë</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {REPORT_DATA.kpis.map((kpi) => (
              <Card key={kpi.label} className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-white">{kpi.value}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${kpi.up ? "text-green-400" : "text-red-400"}`}>
                    {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.delta}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Top opportunities */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" /> Mundësitë Kryesore të Javës
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {REPORT_DATA.topOpportunities.map((o, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                <div>
                  <p className="text-sm font-medium text-white">{o.product}</p>
                  <p className="text-xs text-gray-500">{o.action}</p>
                </div>
                <div className="flex items-center gap-1 text-green-400 font-semibold text-sm">
                  <ArrowUpRight className="h-4 w-4" /> {o.opportunity}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Risks */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" /> Rreziqet e Marzhit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {REPORT_DATA.topRisks.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <div>
                  <p className="text-sm font-medium text-white">{r.product}</p>
                  <p className="text-xs text-gray-500">{r.risk}</p>
                </div>
                <Badge variant={r.severity === "HIGH" ? "danger" : "warning"} className="text-[10px]">{r.severity}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Competitor moves */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-400" /> Lëvizjet e Konkurrentëve
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {REPORT_DATA.competitorMoves.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                <div>
                  <p className="text-sm font-medium text-blue-400">{m.competitor}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.action}</p>
                </div>
                <span className="text-xs text-gray-500">Ndikim: {m.impact}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-700 pt-4 border-t border-gray-800">
          Gjeneruar automatikisht nga PriceSync Manager • {REPORT_DATA.generatedAt}
        </div>
      </div>
    </div>
  );
}
