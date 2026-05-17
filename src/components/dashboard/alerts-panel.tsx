"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, TrendingUp, Package, MapPin, BarChart3, AlertTriangle, Check, CheckCheck } from "lucide-react";
import { timeAgo, categoryLabel } from "@/lib/utils";
import { toast } from "sonner";

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

const ALERT_TYPE_LABELS: Record<string, string> = {
  PRICE_SPIKE: "Rritje Çmimi",
  PRICE_DROP: "Ulje Çmimi",
  COMPETITOR_OUT_OF_STOCK: "Pa Stok",
  MARGIN_OPPORTUNITY: "Mundësi Marzhi",
  MARGIN_RISK: "Rrezik Marzhi",
  REGIONAL_INCONSISTENCY: "Pabarazi Rajonale",
  WEEKLY_SUMMARY: "Raport Javor",
  COMPETITOR_STRATEGY_CHANGE: "Ndryshim Strategjie",
};

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: "border-red-500/40 bg-red-500/5",
  HIGH: "border-red-500/30 bg-red-500/5",
  MEDIUM: "border-yellow-500/30 bg-yellow-500/5",
  LOW: "border-gray-700 bg-gray-900",
};

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: Date;
  metadata: unknown;
  product: { name: string; sku: string; category: string } | null;
}

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  const [localAlerts, setLocalAlerts] = useState(alerts);

  async function markRead(id: string) {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setLocalAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  }

  async function markAllRead() {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setLocalAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    toast.success("Të gjitha njoftimet u shënuan si të lexuara.");
  }

  const unread = localAlerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-white">{unread}</span> të palexuara
        </p>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-gray-400 hover:text-white">
            <CheckCheck className="h-4 w-4" />
            Shëno të gjitha si të lexuara
          </Button>
        )}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {localAlerts.map((alert) => {
          const Icon = ALERT_ICONS[alert.alertType] ?? Bell;
          const severityBadge =
            alert.severity === "CRITICAL" || alert.severity === "HIGH"
              ? "danger"
              : alert.severity === "MEDIUM"
              ? "warning"
              : "info";

          return (
            <Card
              key={alert.id}
              className={`border transition-all ${SEVERITY_STYLES[alert.severity] ?? "border-gray-700"} ${!alert.isRead ? "opacity-100" : "opacity-50"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg ${
                      alert.severity === "HIGH" || alert.severity === "CRITICAL"
                        ? "bg-red-500/20"
                        : alert.severity === "MEDIUM"
                        ? "bg-yellow-500/20"
                        : "bg-blue-500/20"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        alert.severity === "HIGH" || alert.severity === "CRITICAL"
                          ? "text-red-400"
                          : alert.severity === "MEDIUM"
                          ? "text-yellow-400"
                          : "text-blue-400"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={severityBadge as any} className="text-[10px]">
                        {alert.severity}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] bg-gray-800 text-gray-400">
                        {ALERT_TYPE_LABELS[alert.alertType] ?? alert.alertType}
                      </Badge>
                      {!alert.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                      <span className="ml-auto text-xs text-gray-600">{timeAgo(alert.createdAt)}</span>
                    </div>

                    <h3 className="font-semibold text-white mb-1">{alert.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{alert.description}</p>

                    {/* Metadata */}
                    {alert.metadata && typeof alert.metadata === "object" && (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {Object.entries(alert.metadata as Record<string, unknown>)
                          .filter(([, v]) => typeof v === "number" || typeof v === "string")
                          .map(([k, v]) => (
                            <span key={k} className="text-xs text-gray-600">
                              <span className="text-gray-500">{k}:</span>{" "}
                              <span className="text-gray-300 font-medium">
                                {typeof v === "number" && k.toLowerCase().includes("price")
                                  ? `€${(v as number).toFixed(2)}`
                                  : String(v)}
                              </span>
                            </span>
                          ))}
                      </div>
                    )}

                    {alert.product && (
                      <p className="mt-2 text-xs text-gray-600">
                        Produkti: <span className="text-gray-400">{alert.product.name}</span>
                        {" "}·{" "}
                        <span className="text-gray-600">{categoryLabel(alert.product.category)}</span>
                      </p>
                    )}
                  </div>

                  {/* Mark read */}
                  {!alert.isRead && (
                    <button
                      onClick={() => markRead(alert.id)}
                      className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-700 hover:text-gray-300 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {localAlerts.length === 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="flex flex-col items-center py-16 text-gray-500">
              <Bell className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">Nuk ka njoftime</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
