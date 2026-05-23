"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { categoryLabel } from "@/lib/utils";

interface FilterBarProps {
  categories: string[];
  selectedCategory?: string;
  opportunitiesOnly: boolean;
  totalShown: number;
  totalAll: number;
}

export function FilterBar({
  categories,
  selectedCategory,
  opportunitiesOnly,
  totalShown,
  totalAll,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Kategoria</label>
          <select
            value={selectedCategory ?? ""}
            onChange={(e) => update("category", e.target.value || null)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 min-w-[200px]"
          >
            <option value="">Të gjitha kategoritë</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 mt-2 sm:mt-5 cursor-pointer">
          <input
            type="checkbox"
            checked={opportunitiesOnly}
            onChange={(e) => update("opportunities", e.target.checked ? "1" : null)}
            className="h-4 w-4 rounded border-gray-700 bg-gray-800 accent-blue-500"
          />
          <span className="text-xs text-gray-300">
            Vetëm mundësitë <span className="text-gray-500">(jemi 5%+ më lirë)</span>
          </span>
        </label>
      </div>
      <div className="text-xs text-gray-500">
        {isPending ? (
          <span className="text-blue-400 animate-pulse">Duke filtruar...</span>
        ) : (
          <span>
            <span className="text-white font-medium">{totalShown}</span> nga {totalAll} produkte
          </span>
        )}
      </div>
    </div>
  );
}
