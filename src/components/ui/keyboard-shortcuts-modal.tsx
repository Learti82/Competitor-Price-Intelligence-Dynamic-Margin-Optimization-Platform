"use client";

import { useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const shortcuts = [
  { keys: ["g", "g"], label: "Paneli Kryesor" },
  { keys: ["g", "p"], label: "Produktet" },
  { keys: ["g", "c"], label: "Konkurrentët" },
  { keys: ["g", "r"], label: "Rekomandimet" },
  { keys: ["g", "a"], label: "Njoftimet" },
  { keys: ["g", "n"], label: "Analitika" },
  { keys: ["g", "s"], label: "Dyqanet" },
  { keys: ["g", "u"], label: "Regjistri Auditimit" },
  { keys: ["g", "l"], label: "Rregullat e Çmimeve" },
  { keys: ["g", "m"], label: "Kalendari Promovimeve" },
  { keys: ["g", "i"], label: "Importo CSV" },
  { keys: ["?"], label: "Shfaq / Fshih ndihmën" },
];

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);
  useKeyboardShortcuts(() => setOpen((v) => !v));

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-white"
        onClick={() => setOpen(true)}
        title="Shkurtesat e tastierës (?)"
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Shkurtesat e Tastierës</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Shtyp <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 text-xs font-mono">g</kbd> pastaj çelësin e dytë për të naviguar
            </p>
            <div className="space-y-2">
              {shortcuts.map((s) => (
                <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
                  <span className="text-sm text-gray-300">{s.label}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, i) => (
                      <kbd key={i} className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-xs font-mono border border-gray-700">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
