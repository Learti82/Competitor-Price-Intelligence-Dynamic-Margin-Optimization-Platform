"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingUp, AlertTriangle, Package, MapPin, BarChart3, ChevronRight } from "lucide-react";
import { timeAgo } from "@/lib/utils";

const ALERT_ICONS: Record<string, React.ElementType> = {
  PRICE_SPIKE: TrendingUp,
  PRICE_DROP: TrendingUp,
  COMPETITOR_OUT_OF_STOCK: Package,
  MARGIN_OPPORTUNITY: TrendingUp,
  MARGIN_RISK: AlertTriangle,
  REGIONAL_INCONSISTENCY: MapPin,
  WEEKLY_SUMMARY: BarChart3,
  COMPETITOR_STRATEGY_CHANGE: BarChart3,
};

const SEVERITY_BADGE: Record<string, "danger" | "warning" | "info" | "default"> = {
  CRITICAL: "danger",
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "info",
};

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: Date;
}

export function RecentAlerts({ alerts }: { alerts: Alert[] }) {
  return (
    <Card className="bg-gray-900 border-gray-800 h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-400" />
            Njoftime
          </CardTitle>
          <Link
            href="/dashboard/alerts"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Shiko të gjitha <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nuk ka njoftime aktive</p>
          </div>
        )}

        {alerts.map((alert) => {
          const Icon = ALERT_ICONS[alert.alertType] ?? Bell;
          return (
            <div
              key={alert.id}
              className={`relative rounded-lg border p-3 transition-colors ${
                !alert.isRead
                  ? "bg-gray-800 border-gray-700"
                  : "bg-gray-900 border-gray-800 opacity-60"
              }`}
            >
              {!alert.isRead && (
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-blue-500" />
              )}
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                    alert.severity === "HIGH" || alert.severity === "CRITICAL"
                      ? "bg-red-500/15"
                      : alert.severity === "MEDIUM"
                      ? "bg-yellow-500/15"
                      : "bg-blue-500/15"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      alert.severity === "HIGH" || alert.severity === "CRITICAL"
                        ? "text-red-400"
                        : alert.severity === "MEDIUM"
                        ? "text-yellow-400"
                        : "text-blue-400"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={SEVERITY_BADGE[alert.severity] ?? "default"} className="text-[10px] px-1.5 py-0">
                      {alert.severity}
                    </Badge>
                    <span className="text-[10px] text-gray-600">{timeAgo(alert.createdAt)}</span>
                  </div>
                  <p className="text-xs font-medium text-white leading-snug">{alert.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{alert.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
