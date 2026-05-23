import { TrendingUp, Package, Bell, Users, Euro, AlertTriangle } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface Stats {
  totalProducts: number;
  pendingRecommendations: number;
  unreadAlerts: number;
  trackedCompetitors: number;
  avgMargin: number;
  revenueOpportunity: number;
  criticalAlerts?: number;
}

export function DashboardStats({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: "Mundësi Revenue/Ditë",
      value: formatCurrency(stats.revenueOpportunity),
      sub: `${stats.pendingRecommendations} rekomandime aktive`,
      icon: Euro,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      trend: "+",
      trendColor: "text-emerald-400",
    },
    {
      label: "Marzhi Mesatar",
      value: formatPercent(stats.avgMargin),
      sub: "Të gjithë produktet aktive",
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      trend: stats.avgMargin > 10 ? "▲" : "▼",
      trendColor: stats.avgMargin > 10 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "Produkte Aktive",
      value: stats.totalProducts.toString(),
      sub: "SKU të monitoruara",
      icon: Package,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      label: "Konkurrentë",
      value: stats.trackedCompetitors.toString(),
      sub: "Zinxhirë të monitoruar",
      icon: Users,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      label: "Njoftime të Palexuara",
      value: stats.unreadAlerts.toString(),
      sub: "Klikoni për detaje",
      icon: Bell,
      color: stats.unreadAlerts > 0 ? "text-yellow-400" : "text-gray-400",
      bg: stats.unreadAlerts > 0 ? "bg-yellow-500/10" : "bg-gray-500/10",
      border: stats.unreadAlerts > 0 ? "border-yellow-500/20" : "border-gray-700",
    },
    {
      label: "Rekomandimet AI",
      value: stats.pendingRecommendations.toString(),
      sub: "Duke pritur aprovim",
      icon: AlertTriangle,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${card.border} bg-gray-900 p-4`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            {card.trend && (
              <span className={`text-xs font-medium ${card.trendColor}`}>{card.trend}</span>
            )}
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-gray-500 mt-1 leading-snug">{card.label}</p>
          <p className="text-xs text-gray-600 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
