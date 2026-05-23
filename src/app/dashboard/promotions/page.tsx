"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, Calendar, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, parseISO, differenceInDays } from "date-fns";

interface Promotion {
  id: string;
  title: string;
  productName: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  status: string;
  region?: string;
}

const DEMO_PROMOTIONS: Promotion[] = [
  { id: "1", title: "Ofertë fundjavore — Bulmet", productName: "Jogurt Alpina 400g", discountType: "PERCENTAGE", discountValue: 15, startDate: "2026-05-24", endDate: "2026-05-25", status: "SCHEDULED", region: "PRISHTINA" },
  { id: "2", title: "Çmim special — Pije", productName: "Ujë Rugove 1.5L", discountType: "PERCENTAGE", discountValue: 20, startDate: "2026-05-20", endDate: "2026-05-22", status: "ACTIVE" },
  { id: "3", title: "Aksion 3+1 — Kafe", productName: "Kafe Bona 200g", discountType: "BUY_X_GET_Y", discountValue: 25, startDate: "2026-05-28", endDate: "2026-06-04", status: "SCHEDULED" },
  { id: "4", title: "Flash Sale — Kujdes", productName: "Sapun Dove 90g", discountType: "ABSOLUTE", discountValue: 0.30, startDate: "2026-05-15", endDate: "2026-05-18", status: "COMPLETED" },
  { id: "5", title: "Çmim promocional — Mish", productName: "Salsiçe 300g", discountType: "PERCENTAGE", discountValue: 10, startDate: "2026-06-01", endDate: "2026-06-07", status: "SCHEDULED" },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
  SCHEDULED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-gray-700 text-gray-400 border-gray-700",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktiv", SCHEDULED: "Planifikuar", COMPLETED: "Përfunduar", CANCELLED: "Anuluar",
};

function getDiscountLabel(p: Promotion) {
  if (p.discountType === "PERCENTAGE") return `-${p.discountValue}%`;
  if (p.discountType === "ABSOLUTE") return `-€${p.discountValue}`;
  return "3+1 Falas";
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(DEMO_PROMOTIONS);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1)); // May 2026
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", productName: "", discountType: "PERCENTAGE", discountValue: "10", startDate: "", endDate: "" });

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOffset = (startOfMonth(currentMonth).getDay() + 6) % 7;

  function getPromsForDay(day: Date) {
    return promotions.filter((p) => {
      const start = parseISO(p.startDate);
      const end = parseISO(p.endDate);
      return day >= start && day <= end;
    });
  }

  function addPromotion(e: React.FormEvent) {
    e.preventDefault();
    const today = format(new Date(), "yyyy-MM-dd");
    const newProm: Promotion = {
      id: Date.now().toString(),
      title: form.title,
      productName: form.productName,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.startDate <= today && form.endDate >= today ? "ACTIVE" : form.startDate > today ? "SCHEDULED" : "COMPLETED",
    };
    setPromotions((prev) => [...prev, newProm]);
    setShowForm(false);
    toast.success("Promovimi u shtua!");
  }

  const active = promotions.filter((p) => p.status === "ACTIVE").length;
  const upcoming = promotions.filter((p) => p.status === "SCHEDULED").length;

  return (
    <div className="flex flex-col">
      <Header
        title="Kalendari i Promovimeve"
        subtitle={`${active} aktive • ${upcoming} të planifikuara`}
        actions={
          <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Shto Promovim
          </Button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3 className="text-sm font-semibold text-white">{format(currentMonth, "MMMM yyyy")}</h3>
                  <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["Hë", "Ma", "Më", "En", "Pr", "Sh", "Di"].map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-gray-600 py-1">{d}</div>
                  ))}
                </div>
                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {days.map((day) => {
                    const proms = getPromsForDay(day);
                    return (
                      <div key={day.toISOString()}
                        className={`relative min-h-[56px] rounded-lg p-1 border transition-colors ${isToday(day) ? "border-blue-500/50 bg-blue-500/5" : "border-transparent hover:border-gray-700 hover:bg-gray-800"}`}>
                        <span className={`text-xs font-medium ${isToday(day) ? "text-blue-400" : isSameMonth(day, currentMonth) ? "text-gray-400" : "text-gray-700"}`}>
                          {format(day, "d")}
                        </span>
                        {proms.slice(0, 2).map((p) => (
                          <div key={p.id} className={`mt-0.5 rounded px-1 py-0.5 text-[9px] truncate ${p.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : p.status === "SCHEDULED" ? "bg-blue-500/20 text-blue-400" : "bg-gray-700 text-gray-500"}`}>
                            {getDiscountLabel(p)}
                          </div>
                        ))}
                        {proms.length > 2 && (
                          <div className="mt-0.5 text-[9px] text-gray-600">+{proms.length - 2}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Promotions list */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400">Të gjitha promovimEt</h3>
            {promotions.map((p) => (
              <Card key={p.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 flex-shrink-0">
                      <Tag className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <p className="text-xs font-semibold text-white truncate">{p.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${STATUS_STYLES[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{p.productName}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-600">
                        <span className="text-green-400 font-bold">{getDiscountLabel(p)}</span>
                        <span>{format(parseISO(p.startDate), "d MMM")} – {format(parseISO(p.endDate), "d MMM")}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ROI Tracker */}
        <div className="mt-6">
          <h3 className="text-base font-semibold text-white mb-4">ROI Tracker</h3>
          {promotions.filter((p) => p.status === "COMPLETED").length === 0 ? (
            <p className="text-sm text-gray-500">Nuk ka promovime të përfunduara ende.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions
                .filter((p) => p.status === "COMPLETED")
                .map((p) => {
                  const days = Math.max(1, differenceInDays(parseISO(p.endDate), parseISO(p.startDate)));
                  const avgPrice = 2.5; // rough average product price in EUR
                  const impact =
                    p.discountType === "PERCENTAGE"
                      ? (p.discountValue / 100) * avgPrice * 100 * days
                      : p.discountType === "ABSOLUTE"
                      ? p.discountValue * 100 * days
                      : avgPrice * 100 * days;
                  const isPositive = impact > 0;
                  return (
                    <Card key={p.id} className="bg-gray-900 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-xs font-semibold text-white leading-snug flex-1 mr-2">{p.title}</p>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${isPositive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                            {isPositive ? "Pozitiv" : "Negativ"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-3">{p.productName}</p>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Zbritja:</span>
                            <span className="text-green-400 font-medium">{getDiscountLabel(p)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Kohëzgjatja:</span>
                            <span className="text-gray-300">{days} ditë</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Impakti est.:</span>
                            <span className="text-white font-semibold">€{impact.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>

        {/* Add form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <Card className="w-full max-w-lg bg-gray-900 border-gray-700" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-white mb-4">Shto Promovim të Ri</h3>
                <form onSubmit={addPromotion} className="space-y-3">
                  <div><label className="text-xs text-gray-400">Titulli</label>
                    <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="p.sh. Ofertë fundjavore" /></div>
                  <div><label className="text-xs text-gray-400">Produkti</label>
                    <input required value={form.productName} onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="Emri i produktit" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-gray-400">Lloji i zbritjes</label>
                      <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500">
                        <option value="PERCENTAGE">Përqindje (%)</option>
                        <option value="ABSOLUTE">Shumë fikse (€)</option>
                        <option value="BUY_X_GET_Y">3+1 Falas</option>
                      </select></div>
                    <div><label className="text-xs text-gray-400">Vlera</label>
                      <input type="number" min="0" step="0.01" required value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-gray-400">Data e fillimit</label>
                      <input type="date" required value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" /></div>
                    <div><label className="text-xs text-gray-400">Data e mbarimit</label>
                      <input type="date" required value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" /></div>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="text-gray-400">Anulo</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Shto Promovimin</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
