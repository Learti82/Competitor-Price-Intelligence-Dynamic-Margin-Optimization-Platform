"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, Ruler, Trash2, ToggleLeft, ToggleRight, AlertTriangle, TrendingDown, Tag, Package } from "lucide-react";
import { toast } from "sonner";

interface Rule {
  id: string;
  name: string;
  ruleType: string;
  description: string;
  operator: string;
  value: number;
  valueType: string;
  category?: string;
  minMargin?: number;
  isActive: boolean;
  priority: number;
}

const DEMO_RULES: Rule[] = [
  {
    id: "1", name: "Çmim nën Neptun", ruleType: "COMPETITOR_BASED",
    description: "Të gjitha produktet të jenë 3% nën çmimet e Neptunit",
    operator: "BELOW", value: 3, valueType: "PERCENTAGE", isActive: true, priority: 1,
  },
  {
    id: "2", name: "Mbrojtja e Marzhit — Bulmet", ruleType: "MARGIN_PROTECTION",
    description: "Asnjëherë mos shko nën 8% marzh për produktet e bulmeti",
    operator: "MIN", value: 8, valueType: "PERCENTAGE", category: "DAIRY", minMargin: 8, isActive: true, priority: 2,
  },
  {
    id: "3", name: "Pije — Çmim konkurrues", ruleType: "CATEGORY_RULE",
    description: "Kategoria pije: qëndro brenda 2% të mesatares së konkurrentëve",
    operator: "MATCH", value: 2, valueType: "PERCENTAGE", category: "BEVERAGES", isActive: false, priority: 3,
  },
  {
    id: "4", name: "Kujdes personal — Premium", ruleType: "CATEGORY_RULE",
    description: "Produktet e kujdesit personal: lejo deri 10% mbi çmimet e konkurrentëve",
    operator: "ABOVE", value: 10, valueType: "PERCENTAGE", category: "PERSONAL_CARE", isActive: true, priority: 4,
  },
];

const RULE_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  COMPETITOR_BASED: { label: "Bazuar te Konkurrenti", icon: TrendingDown, color: "text-blue-400" },
  MARGIN_PROTECTION: { label: "Mbrojtja e Marzhit", icon: AlertTriangle, color: "text-yellow-400" },
  CATEGORY_RULE: { label: "Rregull Kategorie", icon: Tag, color: "text-purple-400" },
  PRODUCT_RULE: { label: "Rregull Produkti", icon: Package, color: "text-green-400" },
};

const OPERATOR_LABELS: Record<string, string> = {
  BELOW: "Nën", ABOVE: "Mbi", MATCH: "Ngjashëm me", MIN: "Minimum",
};

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>(DEMO_RULES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", ruleType: "COMPETITOR_BASED", operator: "BELOW", value: "5", description: "" });

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, isActive: !r.isActive } : r));
    toast.success("Rregulli u përditësua.");
  }

  function deleteRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success("Rregulli u fshi.");
  }

  function addRule(e: React.FormEvent) {
    e.preventDefault();
    const newRule: Rule = {
      id: Date.now().toString(),
      name: form.name,
      ruleType: form.ruleType,
      description: form.description || `${OPERATOR_LABELS[form.operator]} ${form.value}%`,
      operator: form.operator,
      value: parseFloat(form.value),
      valueType: "PERCENTAGE",
      isActive: true,
      priority: rules.length + 1,
    };
    setRules((prev) => [...prev, newRule]);
    setShowForm(false);
    setForm({ name: "", ruleType: "COMPETITOR_BASED", operator: "BELOW", value: "5", description: "" });
    toast.success("Rregulli u shtua me sukses!");
  }

  const active = rules.filter((r) => r.isActive).length;

  return (
    <div className="flex flex-col">
      <Header
        title="Rregullat e Çmimeve"
        subtitle={`${active} aktive • ${rules.length} gjithsej`}
        actions={
          <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Shto Rregull
          </Button>
        }
      />
      <div className="px-6 py-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3 text-xs text-gray-500 flex items-start gap-2">
          <span className="text-blue-400 mt-0.5">ℹ</span>
          <span>
            <strong className="text-gray-400">Rregullat automatike:</strong> Vendosni rregulla si{" "}
            <em>&quot;qëndro gjithmonë 3% nën Plus Market&quot;</em> ose{" "}
            <em>&quot;mos shko kurrë nën 8% marzh në bulmet&quot;</em>.
            Sistemi i zbaton automatikisht kur gjeneron rekomandime të reja. Rregullat me prioritet më të lartë zbatohen të parët.
          </span>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Info banner */}
        <Card className="bg-blue-600/10 border-blue-500/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Ruler className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-300">Motori i Rregullave të Çmimeve</p>
              <p className="text-xs text-blue-400/80 mt-0.5">
                Rregullat vlerësohen automatikisht çdo ditë. Rekomandimet me çmime gjenerohen duke respektuar prioritetin e rregullave.
                Rregulli me prioritet më të lartë ka përparësi.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Add form */}
        {showForm && (
          <Card className="bg-gray-900 border-blue-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white">Shto Rregull të Ri</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addRule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Emri i rregullit</label>
                  <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="p.sh. Çmim nën Neptun" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Lloji i rregullit</label>
                  <select value={form.ruleType} onChange={(e) => setForm((f) => ({ ...f, ruleType: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500">
                    <option value="COMPETITOR_BASED">Bazuar te Konkurrenti</option>
                    <option value="MARGIN_PROTECTION">Mbrojtja e Marzhit</option>
                    <option value="CATEGORY_RULE">Rregull Kategorie</option>
                    <option value="PRODUCT_RULE">Rregull Produkti</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Operatori</label>
                  <select value={form.operator} onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500">
                    <option value="BELOW">Nën konkurrentin (%)</option>
                    <option value="ABOVE">Mbi konkurrentin (%)</option>
                    <option value="MATCH">Ngjashëm me konkurrentin (%)</option>
                    <option value="MIN">Marzh minimal (%)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Vlera (%)</label>
                  <input type="number" min="0" max="100" step="0.5" required
                    value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs text-gray-400">Përshkrimi (opsional)</label>
                  <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Përshkrimi i rregullit..." />
                </div>
                <div className="md:col-span-2 flex gap-3 justify-end">
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="text-gray-400">Anulo</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Shto Rregullin</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Rules list */}
        <div className="space-y-3">
          {rules.map((rule) => {
            const config = RULE_TYPE_CONFIG[rule.ruleType];
            const Icon = config?.icon ?? Ruler;
            return (
              <Card key={rule.id} className={`border transition-all ${rule.isActive ? "bg-gray-900 border-gray-800" : "bg-gray-900/50 border-gray-800 opacity-60"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800">
                      <Icon className={`h-5 w-5 ${config?.color ?? "text-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-white">{rule.name}</h3>
                        <Badge variant={rule.isActive ? "info" : "secondary"} className="text-[10px]">
                          {rule.isActive ? "Aktiv" : "Joaktiv"}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] bg-gray-800 text-gray-400">
                          {config?.label}
                        </Badge>
                        <span className="ml-auto text-xs text-gray-600">Prioriteti #{rule.priority}</span>
                      </div>
                      <p className="text-sm text-gray-400">{rule.description}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                        <span>Operatori: <span className="text-gray-400">{OPERATOR_LABELS[rule.operator]}</span></span>
                        <span>Vlera: <span className="text-blue-400 font-medium">{rule.value}%</span></span>
                        {rule.category && <span>Kategoria: <span className="text-gray-400">{rule.category}</span></span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleRule(rule.id)} className="text-gray-500 hover:text-blue-400 transition-colors">
                        {rule.isActive ? <ToggleRight className="h-6 w-6 text-blue-400" /> : <ToggleLeft className="h-6 w-6" />}
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
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
