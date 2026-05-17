import Link from "next/link";
import { ArrowRight, BarChart3, TrendingUp, Bell, Zap, Shield, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">PriceSync</span>
              <span className="ml-1 text-lg font-light text-blue-400">Manager</span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Hyr në Panel <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400">
            <Zap className="h-3.5 w-3.5" />
            Ndërtuar posaçërisht për tregun kosovar
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
            Optimizoni Marzhit.<br />
            <span className="text-blue-400">Fitoni Miliona Euro.</span>
          </h1>
          <p className="mb-8 text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Platforma e parë e Inteligjencës Konkurruese të Çmimeve për zinxhirët kosovarë.
            Monitoroni 15 konkurrentë, optimizoni marzhit me AI, dhe mos humbni asnjë mundësi çmimi.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            Shiko Demo Live <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="border-y border-gray-800 bg-gray-900/50 px-6 py-12">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "€3.2B", label: "Tregu kosovar i shitjes me pakicë" },
            { value: "2-5%", label: "Marzhe tipike në ushqim" },
            { value: "€15M+", label: "Kursime potenciale vjetore" },
            { value: "15+", label: "Konkurrentë të monitoruar" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-blue-400">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Gjithçka që ju nevojitet</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: "Panel Çmimesh në Kohë Reale", desc: "Krahasoni çmimet tuaja me Plus Market, Viva Fresh, Proex dhe 12 konkurrentëve të tjerë. Hartë termike e produkteve.", color: "text-blue-400", bg: "bg-blue-500/10" },
              { icon: TrendingUp, title: "Motor Optimizimi AI", desc: "Rekomandimet e marzhit bazuar në COGS, çmimet konkurruese, elasticitetin dhe stokun. Besimi 92%+.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { icon: Bell, title: "Njoftime në Kohë Reale", desc: "Kur Viva Fresh ngre çmimet 12%, ju e dini brenda minutës. Shfrytëzoni çdo mundësi tregu.", color: "text-yellow-400", bg: "bg-yellow-500/10" },
              { icon: Globe, title: "Analiza Rajonale", desc: "Pabarazitë e çmimeve midis rajoneve: Prishtinë vs Prizren vs Pejë. Optimizimi sipas vendndodhjes.", color: "text-purple-400", bg: "bg-purple-500/10" },
              { icon: Shield, title: "Garancitë e Marzhit", desc: "Kurrë mos shisni nën kosto. Limitet e kategorisë parandalojnë çmimin anti-trust. Auditim i plotë.", color: "text-red-400", bg: "bg-red-500/10" },
              { icon: Zap, title: "Multi-Tenant SaaS", desc: "Çdo zinxhir ka tennantin e vet. Rolet: Admin, Menaxher Çmimesh, Menaxher Rajonal, Analist.", color: "text-cyan-400", bg: "bg-cyan-500/10" },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${f.bg} mb-4`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-sm text-gray-600">
        <p>© 2025 PriceSync Manager. Ndërtuar për tregun kosovar. 🇽🇰</p>
      </footer>
    </div>
  );
}
