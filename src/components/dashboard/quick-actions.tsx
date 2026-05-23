"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, Bell, TrendingUp, BarChart3, Zap } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface QuickActionsProps {
  pendingRecs: number;
  revenueOpportunity: number;
  unreadAlerts: number;
  criticalAlerts: number;
  avgMargin: number;
}

export function QuickActions({
  pendingRecs,
  revenueOpportunity,
  unreadAlerts,
  criticalAlerts,
  avgMargin,
}: QuickActionsProps) {
  const actions = [
    pendingRecs > 0 && {
      icon: <Sparkles className="h-4 w-4 text-blue-400" />,
      title: `${pendingRecs} Rekomandime AI aktive`,
      description: `Potencial: ${formatCurrency(revenueOpportunity)}/ditë`,
      href: "/dashboard/recommendations",
      badge: "AI",
      badgeVariant: "info" as const,
      priority: "high",
    },
    unreadAlerts > 0 && {
      icon: <Bell className="h-4 w-4 text-yellow-400" />,
      title: `${unreadAlerts} Njoftime të palexuara`,
      description: criticalAlerts > 0 ? `${criticalAlerts} kritike — kërkon vëmendje` : "Shikoni ndryshimet e fundit",
      href: "/dashboard/alerts",
      badge: criticalAlerts > 0 ? "KRITIKE" : undefined,
      badgeVariant: "danger" as const,
      priority: criticalAlerts > 0 ? "critical" : "medium",
    },
    avgMargin < 8 && {
      icon: <TrendingUp className="h-4 w-4 text-orange-400" />,
      title: "Marzhi mesatar i ulët",
      description: `${avgMargin.toFixed(1)}% — shikoni kategoritë problematike`,
      href: "/dashboard/category-stats",
      priority: "medium",
    },
    {
      icon: <BarChart3 className="h-4 w-4 text-purple-400" />,
      title: "Krahasim me konkurrentët",
      description: "Shikoni pozicionin tuaj në treg",
      href: "/dashboard/competitor-prices",
      badge: "LIVE",
      badgeVariant: "success" as const,
      priority: "normal",
    },
    {
      icon: <Zap className="h-4 w-4 text-cyan-400" />,
      title: "Simulatori i çmimeve",
      description: "Testoni strategji çmimesh para zbatimit",
      href: "/dashboard/simulator",
      priority: "normal",
    },
  ].filter(Boolean) as Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
    badge?: string;
    badgeVariant?: "info" | "success" | "danger" | "warning";
    priority: string;
  }>;

  // Sort: critical > high > medium > normal
  const order = { critical: 0, high: 1, medium: 2, normal: 3 };
  const sorted = [...actions].sort(
    (a, b) => (order[a.priority as keyof typeof order] ?? 3) - (order[b.priority as keyof typeof order] ?? 3)
  );

  const top = sorted.slice(0, 4);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          Veprimet e Sotme
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        {top.map((action, i) => (
          <Link key={i} href={action.href}>
            <div className={`flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-800 cursor-pointer ${
              action.priority === "critical" ? "border border-red-500/30 bg-red-500/5" : ""
            }`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 flex-shrink-0">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{action.title}</p>
                  {action.badge && (
                    <Badge variant={action.badgeVariant ?? "secondary"} className="text-[9px] px-1.5 py-0 shrink-0">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{action.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
