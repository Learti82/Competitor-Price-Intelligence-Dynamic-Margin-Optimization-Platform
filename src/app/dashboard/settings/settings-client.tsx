"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";
import {
  Building2,
  DollarSign,
  Plug,
  Palette,
  AlertTriangle,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  nameAlbanian: string | null;
  hqCity: string;
  hqAddress: string | null;
  numberOfStores: number;
  annualRevenue: number | null;
  currency: string;
  country: string;
}

interface IntegrationsData {
  clerk: boolean;
  anthropic: boolean;
  resend: boolean;
  supabase: boolean;
}

interface Props {
  company: CompanyData;
  integrations: IntegrationsData;
}

export function SettingsClient({ company, integrations }: Props) {
  const router = useRouter();

  // Company info state
  const [companyForm, setCompanyForm] = useState({
    name: company.name,
    nameAlbanian: company.nameAlbanian ?? "",
    hqCity: company.hqCity,
    hqAddress: company.hqAddress ?? "",
    numberOfStores: company.numberOfStores,
    annualRevenue: company.annualRevenue ?? 0,
  });
  const [savingCompany, setSavingCompany] = useState(false);

  // Pricing prefs state
  const [pricingForm, setPricingForm] = useState({
    minMargin: 2,
    maxMargin: 35,
    currency: company.currency,
    country: company.country,
  });
  const [savingPricing, setSavingPricing] = useState(false);

  // Reset state
  const [resetting, setResetting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function patchSettings(updates: Record<string, unknown>) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Gabim gjatë ruajtjes");
    return data;
  }

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    setSavingCompany(true);
    try {
      await patchSettings({
        name: companyForm.name,
        nameAlbanian: companyForm.nameAlbanian || null,
        hqCity: companyForm.hqCity,
        hqAddress: companyForm.hqAddress || null,
        numberOfStores: Number(companyForm.numberOfStores),
        annualRevenue: companyForm.annualRevenue ? Number(companyForm.annualRevenue) : null,
      });
      toast.success("Informacioni i kompanisë u ruajt");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setSavingCompany(false);
    }
  }

  async function handleSavePricing(e: React.FormEvent) {
    e.preventDefault();
    setSavingPricing(true);
    try {
      await patchSettings({
        currency: pricingForm.currency,
        country: pricingForm.country,
      });
      toast.success("Preferencat e çmimeve u ruajtën");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setSavingPricing(false);
    }
  }

  async function handleReset() {
    if (confirmText !== "RESET") {
      toast.error("Shkruani RESET për të konfirmuar");
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/settings/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gabim gjatë resetimit");
      toast.success("Të dhënat u resetuan dhe u rifilluan");
      setConfirmText("");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Section 1: Company Info */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            Informacioni i Kompanisë
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Emri</label>
                <Input
                  required
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Emri në Shqip</label>
                <Input
                  value={companyForm.nameAlbanian}
                  onChange={(e) => setCompanyForm({ ...companyForm, nameAlbanian: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Qyteti Selisë</label>
                <Input
                  required
                  value={companyForm.hqCity}
                  onChange={(e) => setCompanyForm({ ...companyForm, hqCity: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Adresa</label>
                <Input
                  value={companyForm.hqAddress}
                  onChange={(e) => setCompanyForm({ ...companyForm, hqAddress: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Numri i Dyqaneve</label>
                <Input
                  type="number"
                  min={1}
                  value={companyForm.numberOfStores}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, numberOfStores: Number(e.target.value) })
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Të hyrat vjetore (€)</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={companyForm.annualRevenue}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, annualRevenue: Number(e.target.value) })
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={savingCompany}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {savingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Ruaj
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section 2: Pricing Prefs */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            Preferencat e Çmimeve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePricing} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Marzhi minimal i parazgjedhur (%)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step="0.1"
                  value={pricingForm.minMargin}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, minMargin: Number(e.target.value) })
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Marzhi maksimal i parazgjedhur (%)
                </label>
                <Input
                  type="number"
                  min={10}
                  max={50}
                  step="0.1"
                  value={pricingForm.maxMargin}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, maxMargin: Number(e.target.value) })
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Monedha</label>
                <select
                  value={pricingForm.currency}
                  onChange={(e) => setPricingForm({ ...pricingForm, currency: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Vendi</label>
                <select
                  value={pricingForm.country}
                  onChange={(e) => setPricingForm({ ...pricingForm, country: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="XK">Kosovë (XK)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={savingPricing}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {savingPricing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Ruaj
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section 3: Integrations */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Plug className="h-4 w-4 text-purple-400" />
            Integrimet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <IntegrationRow
            name="Clerk Auth"
            active={integrations.clerk}
            hint="Autentifikimi është aktivizuar automatikisht."
          />
          <IntegrationRow
            name="Anthropic AI Chat"
            active={integrations.anthropic}
            hint="Shtoni ANTHROPIC_API_KEY në .env për të aktivizuar bisedën AI."
          />
          <IntegrationRow
            name="Resend Email"
            active={integrations.resend}
            hint="Shtoni RESEND_API_KEY në .env për të dërguar ftesa me email."
          />
          <IntegrationRow
            name="Supabase Database"
            active={integrations.supabase}
            hint="Postgres i lidhur me DATABASE_URL."
            activeLabel="I Lidhur"
          />
        </CardContent>
      </Card>

      {/* Section 4: Visual */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Palette className="h-4 w-4 text-yellow-400" />
            Cilësimet Vizuale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Tema</p>
              <p className="text-xs text-gray-500">Ndërro midis temës së errët dhe të ndritshme</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Danger zone */}
      <Card className="bg-gray-900 border-red-900/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Zona e Rrezikshme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-white font-medium">Reseto të dhënat e demos</p>
              <p className="text-xs text-gray-500 mt-1">
                Fshin të gjitha produktet, çmimet, rekomandimet dhe alertet — pastaj rimbjell të
                dhënat fillestare. Ky veprim nuk mund të kthehet.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder='Shkruani "RESET" për të konfirmuar'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white sm:max-w-xs"
              />
              <Button
                onClick={handleReset}
                disabled={resetting || confirmText !== "RESET"}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Reseto të dhënat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IntegrationRow({
  name,
  active,
  hint,
  activeLabel = "I Aktivizuar",
}: {
  name: string;
  active: boolean;
  hint: string;
  activeLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-800 bg-gray-800/40 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {active ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-gray-500 flex-shrink-0" />
          )}
          <p className="text-sm font-medium text-white">{name}</p>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-6">{hint}</p>
      </div>
      <span
        className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
          active
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-gray-700 text-gray-400 border border-gray-600"
        }`}
      >
        {active ? activeLabel : "Jo i konfiguruar"}
      </span>
    </div>
  );
}
