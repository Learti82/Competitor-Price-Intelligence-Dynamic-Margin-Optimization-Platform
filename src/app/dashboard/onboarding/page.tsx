"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Store, ShoppingCart, Users, Bell, CheckCircle, ChevronRight, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    id: 1, title: "Dyqanet tuaj", icon: Store,
    description: "Shto dyqanet e kompanisë suaj ku do të menaxhoni çmimet.",
    action: "Shko te Dyqanet", href: "/dashboard/stores",
    tips: ["Shto emrin dhe qytetin e dyqanit", "Specifikoni llojin (Supermarket, Hipermarket, etj.)", "Çdo dyqan mund të ketë çmime të ndryshme"],
  },
  {
    id: 2, title: "Katalogu i produkteve", icon: ShoppingCart,
    description: "Ngarko produktet tuaja me çmimet dhe COGS (kostoja e mallit).",
    action: "Shko te Produktet", href: "/dashboard/products",
    tips: ["Shto SKU dhe barkod për çdo produkt", "Vendos COGS për llogaritje të saktë të marzhit", "Importo në masë me CSV nëse ke shumë produkte"],
  },
  {
    id: 3, title: "Konkurrentët", icon: Users,
    description: "Shto konkurrentët që doni të monitoroni në treg.",
    action: "Shko te Konkurrentët", href: "/dashboard/competitors",
    tips: ["Shto të paktën 2-3 konkurrentë kryesorë", "Vendos çmimet e tyre manualisht ose ngarko CSV", "Sistemi do të krahasojë çmimet automatikisht"],
  },
  {
    id: 4, title: "Rregullat e çmimeve", icon: Zap,
    description: "Konfiguro rregullat automatike të çmimeve për të kursyer kohë.",
    action: "Konfiguro Rregullat", href: "/dashboard/rules",
    tips: ["Krijo rregull 'Nën konkurrentin X%'", "Vendos marzhin minimal për çdo kategori", "Rregullat gjenerohen automatikisht çdo ditë"],
  },
  {
    id: 5, title: "Njoftimet", icon: Bell,
    description: "Konfiguro njoftimet për çmimet dhe marzhët kritikë.",
    action: "Shko te Njoftimet", href: "/dashboard/alerts",
    tips: ["Aktivo njoftimet për rreziqe marzhi", "Vendos pragjet për rritje/ulje të çmimeve", "Merr raporte javore automatikisht"],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [completed, setCompleted] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState(1);

  function markComplete(stepId: number) {
    if (!completed.includes(stepId)) {
      setCompleted((prev) => [...prev, stepId]);
      toast.success("Hapi u shënua si i përfunduar!");
    }
    if (stepId < STEPS.length) {
      setActiveStep(stepId + 1);
    }
  }

  const progress = Math.round((completed.length / STEPS.length) * 100);
  const allDone = completed.length === STEPS.length;

  return (
    <div className="flex flex-col">
      <Header title="Fillimi i Punës" subtitle="Konfiguroni PriceSync Manager në 5 hapa" />
      <div className="p-6 space-y-6 max-w-3xl">
        {/* Progress */}
        <Card className={`border ${allDone ? "bg-green-500/10 border-green-500/30" : "bg-gray-900 border-gray-800"}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {allDone ? "🎉 Konfigurimi i plotë!" : "Progresi i konfigurimit"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {allDone ? "PriceSync Manager është gati për përdorim." : `${completed.length} nga ${STEPS.length} hapa të përfunduar`}
                </p>
              </div>
              <div className="text-2xl font-bold text-white">{progress}%</div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-800">
              <div className="h-2.5 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            {allDone && (
              <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white w-full gap-2" onClick={() => router.push("/dashboard")}>
                <Sparkles className="h-4 w-4" /> Shko te Paneli Kryesor
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step) => {
            const isCompleted = completed.includes(step.id);
            const isActive = activeStep === step.id;
            const Icon = step.icon;

            return (
              <Card key={step.id}
                className={`border transition-all cursor-pointer ${isCompleted ? "bg-green-500/5 border-green-500/20" : isActive ? "bg-blue-600/5 border-blue-500/30" : "bg-gray-900 border-gray-800 opacity-70"}`}
                onClick={() => setActiveStep(step.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${isCompleted ? "bg-green-500/20" : isActive ? "bg-blue-600/20" : "bg-gray-800"}`}>
                      {isCompleted
                        ? <CheckCircle className="h-5 w-5 text-green-400" />
                        : <Icon className={`h-5 w-5 ${isActive ? "text-blue-400" : "text-gray-500"}`} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-600 font-mono">Hapi {step.id}</span>
                        {isCompleted && <Badge variant="info" className="text-[10px]">Përfunduar</Badge>}
                        {isActive && !isCompleted && <Badge variant="secondary" className="text-[10px] bg-blue-600/20 text-blue-400">Aktiv</Badge>}
                      </div>
                      <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>

                      {isActive && !isCompleted && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-gray-400">Udhëzime:</p>
                          <ul className="space-y-1">
                            {step.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                                <span className="text-blue-500 mt-0.5">•</span> {tip}
                              </li>
                            ))}
                          </ul>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={(e) => { e.stopPropagation(); router.push(step.href); }}>
                              {step.action} <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white"
                              onClick={(e) => { e.stopPropagation(); markComplete(step.id); }}>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Shëno si të kryer
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
