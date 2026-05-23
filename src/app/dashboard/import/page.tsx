"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download, X } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

interface ParsedRow {
  sku: string;
  price: string;
  store?: string;
  date?: string;
  valid: boolean;
  error?: string;
}

const TEMPLATE_CSV = `sku,price,store,date
SKU-001,1.29,Dyqani Prishtinë,2026-05-20
SKU-002,0.75,Dyqani Prizren,2026-05-20
SKU-003,4.99,Dyqani Pejë,2026-05-20`;

export default function ImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pricesync-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(file: File) {
    setFileName(file.name);
    setImported(false);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const parsed: ParsedRow[] = (results.data as Record<string, string>[]).map((row) => {
          const sku = row.sku?.trim();
          const price = row.price?.trim();
          if (!sku) return { sku: "", price, valid: false, error: "SKU mungon" };
          if (!price || isNaN(parseFloat(price))) return { sku, price, valid: false, error: "Çmimi është invalid" };
          if (parseFloat(price) <= 0) return { sku, price, valid: false, error: "Çmimi duhet të jetë > 0" };
          return { sku, price, store: row.store, date: row.date, valid: true };
        });
        setRows(parsed);
      },
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
      handleFile(file);
    } else {
      toast.error("Ju lutem ngarkoni skedar CSV.");
    }
  }

  async function handleImport() {
    const valid = rows.filter((r) => r.valid);
    if (!valid.length) { toast.error("Nuk ka rreshta të vlefshme."); return; }
    setImporting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setImporting(false);
    setImported(true);
    toast.success(`${valid.length} çmime u importuan me sukses!`);
  }

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <div className="flex flex-col">
      <Header title="Importo Çmime CSV" subtitle="Ngarko çmimet e produkteve në masë" />
      <div className="p-6 space-y-6">
        {/* Instructions */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Si të importosh çmimet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: "1", text: "Shkarko shabllonet CSV", sub: "Fomati i saktë me kolonat e nevojshme" },
                { step: "2", text: "Plotëso çmimet", sub: "Shto SKU, çmim, dyqan dhe datë" },
                { step: "3", text: "Ngarko skedarin", sub: "Sistemi validon dhe importon automatikisht" },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white flex-shrink-0">{s.step}</div>
                  <div>
                    <p className="text-sm font-medium text-white">{s.text}</p>
                    <p className="text-xs text-gray-500">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 border-gray-700 text-gray-400 hover:text-white">
              <Download className="h-4 w-4" /> Shkarko Shabllonin CSV
            </Button>
          </CardContent>
        </Card>

        {/* Upload zone */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 p-10 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-300">Tërhiq skedarin CSV këtu ose klikoni për ta zgjedhur</p>
              <p className="text-xs text-gray-600 mt-1">Mbështet .csv (max 5MB)</p>
              <input ref={inputRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {rows.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm text-white">Parashikimi — {fileName}</CardTitle>
                  <div className="flex gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="h-3.5 w-3.5" /> {validCount} të vlefshme</span>
                    {invalidCount > 0 && <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="h-3.5 w-3.5" /> {invalidCount} me gabime</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleImport} disabled={importing || imported || validCount === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white">
                    {importing ? "Duke importuar..." : imported ? "✓ Importuar" : `Importo ${validCount} çmime`}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setRows([]); setFileName(""); }} className="text-gray-500 hover:text-white">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs text-gray-500">
                      <th className="text-left py-2 pr-4">SKU</th>
                      <th className="text-left py-2 pr-4">Çmimi (€)</th>
                      <th className="text-left py-2 pr-4">Dyqani</th>
                      <th className="text-left py-2 pr-4">Data</th>
                      <th className="text-left py-2">Statusi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-b border-gray-800/50 last:border-0">
                        <td className="py-2 pr-4 text-gray-300 font-mono text-xs">{row.sku || "—"}</td>
                        <td className="py-2 pr-4 text-white">€{parseFloat(row.price || "0").toFixed(2)}</td>
                        <td className="py-2 pr-4 text-gray-400 text-xs">{row.store || "—"}</td>
                        <td className="py-2 pr-4 text-gray-500 text-xs">{row.date || "Sot"}</td>
                        <td className="py-2">
                          {row.valid
                            ? <Badge variant="info" className="text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />OK</Badge>
                            : <Badge variant="danger" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />{row.error}</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 && (
                  <p className="text-xs text-gray-600 mt-2 text-center">+{rows.length - 50} rreshta të tjera</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
