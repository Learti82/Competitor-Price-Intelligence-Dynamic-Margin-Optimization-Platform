"use client";

import { Bell, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { KeyboardShortcutsModal } from "@/components/ui/keyboard-shortcuts-modal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserButton } from "@clerk/nextjs";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    startTransition(() => {
      if (q) {
        router.push(`/dashboard/products?q=${encodeURIComponent(q)}`);
      } else {
        router.push("/dashboard/products");
      }
    });
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950/95 px-6 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${isPending ? "text-blue-400 animate-pulse" : "text-gray-500"}`} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kërko produkt, konkurrent..."
            className="w-64 pl-9 bg-gray-900 border-gray-700 text-gray-300 placeholder:text-gray-600 text-sm h-8"
          />
        </form>

        <ThemeToggle />
        <KeyboardShortcutsModal />

        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white h-8 w-8"
          onClick={() => router.refresh()}
          title="Rifresko"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        <Link href="/dashboard/alerts">
          <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              !
            </span>
          </Button>
        </Link>

        <UserButton
          appearance={{
            elements: { avatarBox: "h-8 w-8" },
          }}
        />
      </div>
    </header>
  );
}
