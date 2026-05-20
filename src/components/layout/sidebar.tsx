"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Users, TrendingUp, Bell, BarChart3,
  Store, ClipboardList, Settings, ChevronRight, Zap, Ruler,
  Calendar, Upload, FileText, Sparkles, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const navItems = [
  { label: "Paneli Kryesor", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Produktet", href: "/dashboard/products", icon: ShoppingCart },
  { label: "Konkurrentët", href: "/dashboard/competitors", icon: Users },
  {
    label: "Rekomandimet", href: "/dashboard/recommendations", icon: TrendingUp,
    badge: "AI", badgeVariant: "info" as const,
  },
  {
    label: "Njoftimet", href: "/dashboard/alerts", icon: Bell,
    badge: "6", badgeVariant: "danger" as const,
  },
  { label: "Analitika", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Dyqanet", href: "/dashboard/stores", icon: Store },
  { label: "Regjistri Auditimit", href: "/dashboard/audit", icon: ClipboardList },
];

const advancedItems = [
  { label: "Rregullat e Çmimeve", href: "/dashboard/rules", icon: Ruler },
  { label: "Promovime", href: "/dashboard/promotions", icon: Calendar },
  { label: "Importo CSV", href: "/dashboard/import", icon: Upload },
  { label: "Raport Javor", href: "/dashboard/report", icon: FileText },
  { label: "Fillimi i Punës", href: "/dashboard/onboarding", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex h-full w-64 flex-col bg-gray-950 border-r border-gray-800">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">PriceSync</p>
            <p className="text-xs text-gray-400">Manager</p>
          </div>
        </div>
        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              )}>
              <item.icon className={cn("h-4 w-4", isActive ? "text-blue-400" : "text-gray-500")} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant={item.badgeVariant ?? "default"} className="text-[10px] px-1.5 py-0.5">
                  {item.badge}
                </Badge>
              )}
              {isActive && <ChevronRight className="h-3 w-3 text-blue-400" />}
            </Link>
          );
        })}

        <div className="pt-3 pb-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Të Avancuara</p>
        </div>

        {advancedItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              )}>
              <item.icon className={cn("h-4 w-4", isActive ? "text-blue-400" : "text-gray-500")} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-800 p-3">
        <Link href="/dashboard/settings" onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors">
          <Settings className="h-4 w-4 text-gray-500" />
          <span>Cilësimet</span>
        </Link>
        <div className="mt-3 rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/20 p-3">
          <p className="text-xs font-semibold text-blue-400">MarkAl Group</p>
          <p className="text-xs text-gray-500 mt-0.5">Plan Enterprise • 8 dyqane</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="h-1.5 flex-1 rounded-full bg-gray-700">
              <div className="h-1.5 w-3/4 rounded-full bg-blue-500" />
            </div>
            <span className="text-[10px] text-gray-500">38 SKU</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-white"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute left-0 top-0 h-full" onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        {content}
      </div>
    </>
  );
}
