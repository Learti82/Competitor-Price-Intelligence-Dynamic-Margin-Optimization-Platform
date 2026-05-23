"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportButtonProps {
  type: "products" | "competitors" | "recommendations" | "alerts" | "audit";
  label?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "icon";
}

export function ExportButton({ type, label = "Eksporto Excel", variant = "outline", size = "sm" }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/export/${type}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pricesync-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Skedari u eksportua me sukses!");
    } catch {
      toast.error("Gabim gjatë eksportimit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleExport} disabled={loading}
      className="gap-2 border-gray-700 text-gray-400 hover:text-white">
      <Download className="h-4 w-4" />
      {size !== "icon" && (loading ? "Duke eksportuar..." : label)}
    </Button>
  );
}
