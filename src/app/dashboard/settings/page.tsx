import { requireCompany } from "@/lib/get-company";
import { Header } from "@/components/layout/header";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const company = await requireCompany();

  const integrations = {
    clerk: true,
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    resend: Boolean(process.env.RESEND_API_KEY),
    supabase: Boolean(process.env.DATABASE_URL),
  };

  return (
    <div className="flex flex-col">
      <Header
        title="Cilësimet"
        subtitle="Konfiguro kompaninë, çmimet dhe integrimet"
      />
      <div className="p-6">
        {company ? (
          <SettingsClient
            company={{
              id: company.id,
              name: company.name,
              nameAlbanian: company.nameAlbanian,
              hqCity: company.hqCity,
              hqAddress: company.hqAddress,
              numberOfStores: company.numberOfStores,
              annualRevenue: company.annualRevenue,
              currency: company.currency,
              country: company.country,
            }}
            integrations={integrations}
          />
        ) : (
          <div className="text-sm text-gray-400">Nuk u gjet kompania juaj.</div>
        )}
      </div>
    </div>
  );
}
