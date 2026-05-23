"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Users, TrendingUp, Bell, BarChart3,
  Store, ClipboardList, Settings, ChevronRight, Zap, Ruler,
  Calendar, Upload, FileText, Sparkles, Menu, X, Bot, RefreshCw,
  PieChart, GitCompare, Layers, UserPlus, Shield, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";

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
  },
  { label: "Analitika", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Dyqanet", href: "/dashboard/stores", icon: Store },
  { label: "Regjistri Auditimit", href: "/dashboard/audit", icon: ClipboardList },
];

const intelligenceItems = [
  { label: "Asistenti AI", href: "/dashboard/chat", icon: Bot, badge: "AI", badgeVariant: "info" as const },
  { label: "Simulatori", href: "/dashboard/simulator", icon: GitCompare },
  { label: "Vëzhguesi Konkurrentëve", href: "/dashboard/competitor-watch", icon: RefreshCw },
  { label: "Kategoritë", href: "/dashboard/category-stats", icon: PieChart },
  { label: "Waterfall Marzhit", href: "/dashboard/waterfall", icon: Layers },
];

const operationsItems = [
  { label: "Rregullat e Çmimeve", href: "/dashboard/rules", icon: Ruler },
  { label: "Promovime & ROI", href: "/dashboard/promotions", icon: Calendar },
  { label: "Çmimet Sipas Dyqanit", href: "/dashboard/store-prices", icon: DollarSign },
  { label: "Skaneri i Çmimeve", href: "/dashboard/scraper", icon: RefreshCw },
  { label: "Importo CSV", href: "/dashboard/import", icon: Upload },
  { label: "Kostot Furnizuesit", href: "/dashboard/supplier-import", icon: FileText },
];

const managementItems = [
  { label: "Ekipi & Rolet", href: "/dashboard/team", icon: UserPlus },
  { label: "Paneli Admin", href: "/dashboard/admin", icon: Shield },
  { label: "Raport Javor", href: "/dashboard/report", icon: FileText },
  { label: "Fillimi i Punës", href: "/dashboard/onboarding", icon: Sparkles },
];

type NavItem = { label: string; href: string; icon: React.ElementType; badge?: string; badgeVariant?: string };

function NavSection({ title, items, pathname, onClose }: {
  title: string;
  items: NavItem[];
  pathname: string;
  onClose: () => void;
}) {
  return (
    <>
      <div className="pt-3 pb-1">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-600">{title}</p>
      </div>
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
            )}>
            <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-blue-400" : "text-gray-500")} />
            <span className="flex-1 truncate">{item.label}</span>
            {"badge" in item && item.badge && (
              <Badge variant={(item as any).badgeVariant ?? "default"} className="text-[10px] px-1.5 py-0.5">
                {item.badge}
              </Badge>
            )}
            {isActive && <ChevronRight className="h-3 w-3 text-blue-400 flex-shrink-0" />}
          </Link>
        );
      })}
    </>
  );
}

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
      <nav className="flex-1 overflow-y-auto space-y-0.5 px-3 py-3">
        {/* Core nav */}
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              )}>
              <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-blue-400" : "text-gray-500")} />
              <span className="flex-1 truncate">{item.label}</span>
              {"badge" in item && item.badge && (
                <Badge variant={(item as any).badgeVariant ?? "default"} className="text-[10px] px-1.5 py-0.5">
                  {item.badge}
                </Badge>
              )}
              {isActive && <ChevronRight className="h-3 w-3 text-blue-400 flex-shrink-0" />}
            </Link>
          );
        })}

        <NavSection title="Inteligjencë" items={intelligenceItems} pathname={pathname} onClose={() => setMobileOpen(false)} />
        <NavSection title="Operacionet" items={operationsItems} pathname={pathname} onClose={() => setMobileOpen(false)} />
        <NavSection title="Menaxhimi" items={managementItems} pathname={pathname} onClose={() => setMobileOpen(false)} />
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-800 p-3 space-y-1">
        <Link href="/dashboard/settings" onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors">
          <Settings className="h-4 w-4 text-gray-500" />
          <span>Cilësimet</span>
        </Link>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          <span className="text-sm text-gray-400">Llogaria ime</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-white"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute left-0 top-0 h-full" onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}

      <div className="hidden md:flex h-full">
        {content}
      </div>
    </>
  );
}
