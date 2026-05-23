"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Database, Sparkles, CheckCircle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const FEATURES = [
  "154 produkte të katalogut me çmime dhe marzhe reale",
  "10 konkurrentë kosovarë (Plus Market, Viva Fresh, Proex, Maxi…)",
  "60 ditë historik çmimesh me ~55,000 pika të dhënash",
  "38 rekomandime AI të gjenero-uara me analiza marzhi",
  "Rregulla çmimesh, promovime, njoftime, dhe raporte javore",
];

export function SetupPrompt() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [step, setStep] = useState("");

  async function initialize() {
    setStatus("loading");
    setStep("Po krijohen konkurrentët dhe dyqanet…");
    try {
      const res = await fetch("/api/init-user", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed");
      }
      setStatus("done");
      setStep("U inicializua me sukses! Po rifresohet faqja…");
      setTimeout(() => router.refresh(), 1800);
    } catch (e: unknown) {
      setStatus("error");
      const msg = e instanceof Error ? e.message : "Gabim";
      setStep(msg);
    }
  }

  if (status === "done") {
    return (
      <div className="col-span-full flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle className="h-7 w-7 text-green-400" />
          </div>
          <p className="text-white font-semibold">Të dhënat demo u ngarkuan!</p>
          <p className="text-sm text-gray-400">Po rifresohet paneli…</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="col-span-full border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-gray-900 overflow-hidden">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left: main CTA */}
          <div className="p-8 flex flex-col justify-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 ring-1 ring-blue-500/30">
              <Database className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Mirë se vini në PriceSync Manager!</h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                Nisni me të dhëna demo realiste nga tregu kosovar dhe eksploroni të gjitha funksionalitetet e platformës.
              </p>
            </div>

            {status === "error" && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {step}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={initialize}
                disabled={status === "loading"}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 flex-1 sm:flex-none"
                size="lg"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">{step || "Duke inicializuar…"}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Ngarko të dhënat demo
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-gray-400 hover:text-white border border-gray-700 gap-1"
                onClick={() => router.push("/dashboard/onboarding")}
              >
                Si funksionon
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {status === "loading" && (
              <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
            )}
          </div>

          {/* Right: feature list */}
          <div className="border-t md:border-t-0 md:border-l border-blue-500/10 bg-blue-500/5 p-8 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-4">
              Çfarë përfshihet:
            </p>
            <ul className="space-y-3">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
