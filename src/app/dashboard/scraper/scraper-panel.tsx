"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { RefreshCw, PlusCircle, Upload, Clock, CheckCircle2, XCircle, Loader2, Info, Download } from "lucide-react";

interface ScraperRun {
  id: string;
  status: string;
  itemsScraped: number;
  startedAt: Date | string;
  completedAt: Date | string | null;
  log: string[];
}

interface Competitor {
  id: string;
  name: string;
}

interface ScraperPanelProps {
  initialRuns: ScraperRun[];
  competitors: Competitor[];
}

const CATEGORIES = [
  ["BEVERAGES", "Pije"],
  ["DAIRY", "Bulmet"],
  ["MEAT_POULTRY", "Mish & Shpezë"],
  ["FRUITS_VEGETABLES", "Fruta & Perime"],
  ["BAKERY", "Bukëtari"],
  ["FROZEN", "Produkte të Ngrira"],
  ["SNACKS_CONFECTIONERY", "Ëmbëlsira & Çips"],
  ["PERSONAL_CARE", "Higjenë Personale"],
  ["HOUSEHOLD", "Pastrim Shtëpie"],
  ["PASTA_GRAINS", "Makarona & Drithëra"],
  ["CANNED_GOODS", "Konserva"],
  ["OILS_FATS", "Vaj & Yndyrna"],
  ["CONDIMENTS", "Erëza & Salca"],
  ["COFFEE_TEA", "Kafe & Çaj"],
  ["ALCOHOL", "Alkool"],
  ["CLEANING", "Detergjent"],
];

function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED")
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border text-[11px] gap-1"><CheckCircle2 className="h-3 w-3" />Kompletuar</Badge>;
  if (status === "RUNNING")
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-[11px] gap-1"><Loader2 className="h-3 w-3 animate-spin" />Duke u ekzekutuar</Badge>;
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-[11px] gap-1"><XCircle className="h-3 w-3" />Dështuar</Badge>;
}

function duration(run: ScraperRun) {
  if (!run.completedAt) return "—";
  const sec = Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000);
  return sec < 60 ? `${sec}s` : `${Math.round(sec / 60)}m ${sec % 60}s`;
}

type Tab = "auto" | "manual" | "csv";

export function ScraperPanel({ initialRuns, competitors }: ScraperPanelProps) {
  const [tab, setTab] = useState<Tab>("auto");
  const [runs, setRuns] = useState<ScraperRun[]>(initialRuns);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Auto scraper
  const [running, setRunning] = useState(false);

  // Manual entry
  const [competitorId, setCompetitorId] = useState(competitors[0]?.id ?? "");
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("BEVERAGES");
  const [price, setPrice] = useState("");
  const [isPromotion, setIsPromotion] = useState(false);
  const [originalPrice, setOriginalPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // CSV import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  async function triggerScraper() {
    setRunning(true);
    try {
      const res = await fetch("/api/scraper", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gabim");
      toast.success(`Skanim u krye — ${data.itemsScraped} çmime u përditësuan`);
      const listRes = await fetch("/api/scraper");
      const listData = await listRes.json();
      if (listData.runs) setRuns(listData.runs);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setRunning(false);
    }
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim() || !price || !competitorId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/scraper/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorId, productName, brand, category, price, isOnPromotion: isPromotion, originalPrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gabim");
      toast.success(`Çmimi u regjistrua: ${productName} — €${price}`);
      setProductName(""); setBrand(""); setPrice(""); setOriginalPrice(""); setIsPromotion(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/scraper/csv", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gabim");
      setImportResult(data);
      toast.success(`${data.imported} çmime u importuan`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const rows = [
      "competitor_name,product_name,brand,category,price,is_promotion,original_price",
      "Viva Fresh,Coca-Cola 2L,Coca-Cola,BEVERAGES,1.55,no,",
      "Proex,Qumësht Deva 1L,Deva,DAIRY,0.95,yes,1.10",
      "Plus Market (ELKOS Group),Bukë e bardhë 500g,,BAKERY,0.55,no,",
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "competitor_prices_template.csv";
    a.click();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "auto", label: "Auto-Skaner" },
    { id: "manual", label: "Regjistrim Manual" },
    { id: "csv", label: "Import CSV" },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 p-1 rounded-lg w-fit border border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* AUTO SCRAPER */}
      {tab === "auto" && (
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-white font-medium mb-1">Viva Fresh Auto-Skanim</h3>
                  <p className="text-xs text-gray-500">
                    Skano automatikisht çmimet nga{" "}
                    <span className="text-blue-400">online.vivafresh.shop</span> — i vetmi dyqan online në Kosovë me çmime publike.
                    Skanimi kryhet automatikisht çdo ditë në orën 06:00.
                  </p>
                </div>
                <Button onClick={triggerScraper} disabled={running} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white w-fit">
                  <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
                  {running ? "Duke skanuar..." : "Ekzekuto Tani"}
                </Button>
                <div className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                  <Info className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300">
                    Nëse skanimi kthen 0 produkte, duhet të përditësohen CSS selector-at. Hap{" "}
                    <span className="font-mono bg-gray-900 px-1 rounded">src/lib/scrapers/viva-fresh.ts</span>{" "}
                    dhe ndiq udhëzimet në krye të fajllit.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                Historia e Skanimeve
              </CardTitle>
            </CardHeader>
            <CardContent>
              {runs.length === 0 ? (
                <p className="text-sm text-gray-500">Nuk ka skanime ende.</p>
              ) : (
                <div className="space-y-2">
                  {runs.map((run) => (
                    <div key={run.id} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={run.status} />
                          <div>
                            <p className="text-xs text-gray-300">{format(new Date(run.startedAt), "dd/MM/yyyy HH:mm")}</p>
                            <p className="text-[11px] text-gray-500">{run.itemsScraped} çmime • {duration(run)}</p>
                          </div>
                        </div>
                        {run.log?.length > 0 && (
                          <button
                            onClick={() => setExpandedLog(expandedLog === run.id ? null : run.id)}
                            className="text-[11px] text-blue-400 hover:text-blue-300"
                          >
                            {expandedLog === run.id ? "Mbyll log" : "Shiko log"}
                          </button>
                        )}
                      </div>
                      {expandedLog === run.id && (
                        <div className="mt-2 rounded bg-gray-950 p-2 font-mono text-[10px] text-gray-400 max-h-40 overflow-y-auto">
                          {run.log.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MANUAL ENTRY */}
      {tab === "manual" && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-emerald-400" />
              Regjistro Çmim Manualisht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 mb-4 text-xs text-blue-300">
              Për konkurrentët pa faqe online (Plus Market, Proex, Interex etj.) — ekipi juaj regjistron çmimet që sheh fizikisht në dyqan.
            </div>
            <form onSubmit={submitManual} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Konkurrenti *</label>
                  <select
                    value={competitorId}
                    onChange={(e) => setCompetitorId(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    required
                  >
                    {competitors.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Kategoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Emri i Produktit *</label>
                  <Input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="p.sh. Coca-Cola 2L"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Marka</label>
                  <Input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="p.sh. Coca-Cola"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Çmimi (€) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1.55"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-2 block flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPromotion}
                      onChange={(e) => setIsPromotion(e.target.checked)}
                      className="rounded"
                    />
                    Çmim Promovimi
                  </label>
                  {isPromotion && (
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="Çmimi origjinal para promovimit (€)"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  )}
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <PlusCircle className="h-4 w-4" />
                {submitting ? "Duke ruajtur..." : "Regjistro Çmimin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* CSV IMPORT */}
      {tab === "csv" && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Upload className="h-4 w-4 text-purple-400" />
              Import Çmimesh nga CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-4 text-xs text-gray-400 space-y-2">
              <p className="font-medium text-gray-300">Formati i CSV-it:</p>
              <code className="block bg-gray-950 rounded p-2 font-mono text-[11px] text-gray-400">
                competitor_name, product_name, brand, category, price, is_promotion, original_price
              </code>
              <div className="space-y-1">
                <p>• <strong className="text-gray-300">competitor_name</strong> — emri i saktë (p.sh. "Viva Fresh", "Plus Market (ELKOS Group)")</p>
                <p>• <strong className="text-gray-300">category</strong> — BEVERAGES, DAIRY, MEAT_POULTRY, FRUITS_VEGETABLES, BAKERY, FROZEN, SNACKS_CONFECTIONERY...</p>
                <p>• <strong className="text-gray-300">is_promotion</strong> — yes / no</p>
                <p>• <strong className="text-gray-300">original_price</strong> — lër bosh nëse nuk është në promovim</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 border-gray-700 text-gray-400 hover:text-white">
              <Download className="h-4 w-4" />
              Shkarko Shabllon CSV
            </Button>
            <div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" id="csv-upload" />
              <label htmlFor="csv-upload">
                <div className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  importing ? "border-purple-500/50 bg-purple-500/5" : "border-gray-700 hover:border-purple-500/50 hover:bg-purple-500/5"
                }`}>
                  {importing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                      <p className="text-sm text-purple-400">Duke importuar...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-gray-500" />
                      <p className="text-sm text-gray-400">Kliko ose tërhiq CSV-in këtu</p>
                      <p className="text-xs text-gray-600">Vetëm .csv</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
            {importResult && (
              <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-4 space-y-2">
                <p className="text-sm font-medium text-white">Rezultati i Importit</p>
                <p className="text-xs text-emerald-400">✓ {importResult.imported} çmime u importuan me sukses</p>
                {importResult.skipped > 0 && (
                  <p className="text-xs text-yellow-400">⚠ {importResult.skipped} rreshta u anashkaluan</p>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {importResult.errors.map((e, i) => (
                      <p key={i} className="text-[11px] text-red-400">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
