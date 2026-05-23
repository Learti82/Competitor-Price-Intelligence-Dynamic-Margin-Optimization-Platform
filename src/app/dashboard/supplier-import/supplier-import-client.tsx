"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Download, FileText, CheckCircle, XCircle } from "lucide-react";
import Papa from "papaparse";
import { formatCurrency } from "@/lib/utils";

interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  cogs: number;
}

interface ParsedRow {
  sku: string;
  newCogs: number;
  product: ProductRecord | null;
  status: "found" | "not_found";
}

interface SupplierImportClientProps {
  products: ProductRecord[];
}

const TEMPLATE_CSV = `SKU,COGS_EUR
SKU-001,0.85
SKU-002,1.20
SKU-003,3.50`;

export function SupplierImportClient({ products }: SupplierImportClientProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const productBySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "supplier-cogs-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(file: File) {
    setFileName(file.name);
    setApplied(false);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const parsed: ParsedRow[] = results.data.map((row) => {
          const sku = (row["SKU"] ?? row["sku"] ?? "").trim();
          const cogsRaw = (row["COGS_EUR"] ?? row["cogs_eur"] ?? row["COGS"] ?? "").trim();
          const newCogs = parseFloat(cogsRaw);
          const product = productBySku.get(sku.toLowerCase()) ?? null;
          return {
            sku,
            newCogs: isNaN(newCogs) ? 0 : newCogs,
            product,
            status: product ? "found" : "not_found",
          };
        });
        setRows(parsed);
      },
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFile(file);
    } else {
      toast.error("Ju lutem ngarkoni skedar CSV.");
    }
  }

  async function handleApply() {
    const valid = rows.filter((r) => r.status === "found" && r.newCogs > 0);
    if (valid.length === 0) {
      toast.error("Nuk ka rreshta të vlefshëm për aplikim.");
      return;
    }
    setApplying(true);
    try {
      const updates = valid.map((r) => ({
        productId: r.product!.id,
        newCogs: r.newCogs,
      }));
      const res = await fetch("/api/supplier-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gabim");
      toast.success(`${data.updated} produkte u përditësuan me COGS të ri!`);
      setApplied(true);
      setRows([]);
      setFileName("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setApplying(false);
    }
  }

  const foundCount = rows.filter((r) => r.status === "found").length;
  const notFoundCount = rows.filter((r) => r.status === "not_found").length;

  return (
    <div className="space-y-6">
      {/* Template download */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-medium text-white">Template CSV</p>
            <p className="text-xs text-gray-400">Shkarko shabllon me kolonat e duhura: SKU, COGS_EUR</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadTemplate}
            className="gap-2 border border-gray-700 text-gray-300 hover:text-white"
          >
            <Download className="h-4 w-4" />
            Shkarko Template
          </Button>
        </CardContent>
      </Card>

      {/* Drag & drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors cursor-pointer ${
          dragging
            ? "border-blue-500 bg-blue-500/5"
            : "border-gray-700 bg-gray-900 hover:border-gray-600"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-800">
          <Upload className="h-6 w-6 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white">
            {fileName || "Tërhiq & lëshoni CSV-në këtu"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ose kliko për të zgjedhur — vetëm .csv
          </p>
        </div>
        {applied && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="h-5 w-5" />
            Ndryshimet u aplikuan me sukses!
          </div>
        )}
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Parapamje — {rows.length} rreshta
            </CardTitle>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-400">{foundCount} gjetur</span>
              {notFoundCount > 0 && (
                <span className="text-red-400">{notFoundCount} negjettur</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500">
                    <th className="text-left py-2 pr-4">SKU</th>
                    <th className="text-left py-2 pr-4">COGS Aktual</th>
                    <th className="text-left py-2 pr-4">COGS i Ri</th>
                    <th className="text-left py-2 pr-4">Ndryshimi</th>
                    <th className="text-left py-2">Statusi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const currentCogs = row.product?.cogs ?? null;
                    const diff = currentCogs !== null ? row.newCogs - currentCogs : null;
                    const diffPct = currentCogs !== null && currentCogs > 0 ? ((row.newCogs - currentCogs) / currentCogs) * 100 : null;
                    return (
                      <tr key={i} className="border-b border-gray-800/50 last:border-0">
                        <td className="py-2.5 pr-4 text-white font-mono text-xs">{row.sku}</td>
                        <td className="py-2.5 pr-4 text-gray-400 text-xs">
                          {currentCogs !== null ? formatCurrency(currentCogs) : "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-white text-xs font-medium">
                          {row.newCogs > 0 ? formatCurrency(row.newCogs) : "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-xs">
                          {diff !== null && diffPct !== null ? (
                            <span className={diff > 0 ? "text-red-400" : diff < 0 ? "text-green-400" : "text-gray-400"}>
                              {diff > 0 ? "+" : ""}{formatCurrency(diff)} ({diffPct > 0 ? "+" : ""}{diffPct.toFixed(1)}%)
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-2.5">
                          {row.status === "found" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              Gjetur
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
                              <XCircle className="h-3 w-3" />
                              Negjettur
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleApply}
                disabled={applying || foundCount === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {applying ? "Duke aplikuar..." : `Apliko Ndryshimet (${foundCount})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
