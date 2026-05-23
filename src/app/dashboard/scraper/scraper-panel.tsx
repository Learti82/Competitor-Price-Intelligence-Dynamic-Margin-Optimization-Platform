"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ScraperRun {
  id: string;
  status: string;
  itemsScraped: number;
  startedAt: Date | string;
  completedAt: Date | string | null;
}

interface ScraperPanelProps {
  initialRuns: ScraperRun[];
}

function statusBadge(status: string) {
  if (status === "COMPLETED")
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border text-[11px]">
        COMPLETED
      </Badge>
    );
  if (status === "RUNNING")
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-[11px]">
        RUNNING
      </Badge>
    );
  return (
    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-[11px]">
      FAILED
    </Badge>
  );
}

function durationSec(run: ScraperRun) {
  if (!run.completedAt) return "—";
  const start = new Date(run.startedAt).getTime();
  const end = new Date(run.completedAt).getTime();
  const sec = Math.round((end - start) / 1000);
  return `${sec}s`;
}

export function ScraperPanel({ initialRuns }: ScraperPanelProps) {
  const [runs, setRuns] = useState<ScraperRun[]>(initialRuns);
  const [running, setRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  async function triggerScraper() {
    setRunning(true);
    setStatusMsg("Duke skanuar çmimet...");
    try {
      const res = await fetch("/api/scraper", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gabim");
      toast.success(`Skanim u krye — ${data.itemsScraped} çmime u përditësuan`);
      setStatusMsg("");
      // Refresh run list
      const listRes = await fetch("/api/scraper");
      const listData = await listRes.json();
      if (listData.runs) setRuns(listData.runs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gabim i panjohur";
      toast.error(`Gabim: ${msg}`);
      setStatusMsg("");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Trigger card */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            onClick={triggerScraper}
            disabled={running}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
            Ekzekuto Scraper-in
          </Button>
          {statusMsg && (
            <p className="text-sm text-yellow-400 animate-pulse">{statusMsg}</p>
          )}
        </CardContent>
      </Card>

      {/* Run history */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white">Historia e Skanimeve</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-gray-500">Nuk ka skanime të kryera ende.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500">
                    <th className="text-left py-2 pr-4">Filloi Në</th>
                    <th className="text-left py-2 pr-4">Statusi</th>
                    <th className="text-left py-2 pr-4">Artikuj të Skanuar</th>
                    <th className="text-left py-2">Kohëzgjatja</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-gray-800/50 last:border-0">
                      <td className="py-2 pr-4 text-gray-300 text-xs">
                        {format(new Date(run.startedAt), "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="py-2 pr-4">{statusBadge(run.status)}</td>
                      <td className="py-2 pr-4 text-white font-medium">
                        {run.itemsScraped}
                      </td>
                      <td className="py-2 text-gray-400 text-xs">{durationSec(run)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note */}
      <div className="flex items-start gap-2 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <Info className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          Scraper-i simulon ndryshimet e çmimeve. Në prodhim do të lidhej me faqet e konkurrentëve.
        </p>
      </div>
    </div>
  );
}
