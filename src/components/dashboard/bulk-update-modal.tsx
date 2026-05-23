"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Layers } from "lucide-react";

interface BulkUpdateModalProps {
  productIds: string[];
}

export function BulkUpdateModal({ productIds }: BulkUpdateModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [changeType, setChangeType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [changeValue, setChangeValue] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(changeValue);
    if (isNaN(value)) {
      toast.error("Vendos vlerën e ndryshimit.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/products/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds,
          changeType,
          changeValue: value,
          reason: reason.trim() || "Përditësim i shumëfishtë",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gabim");
      toast.success(`${data.updated} produkte u përditësuan me sukses!`);
      setOpen(false);
      setChangeValue("");
      setReason("");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
      >
        <Layers className="h-4 w-4" />
        Përditëso Shumë
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <Card
            className="w-full max-w-md bg-gray-900 border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-white">Përditëso Shumë Produkte</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Do të ndikojë {productIds.length} produkte
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                {/* Change type */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Lloji i ndryshimit</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setChangeType("PERCENTAGE")}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                        changeType === "PERCENTAGE"
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-gray-700 bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      Përqindje (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChangeType("FIXED")}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                        changeType === "FIXED"
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-gray-700 bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      Shumë Fikse (€)
                    </button>
                  </div>
                </div>

                {/* Value */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">
                    Vlera {changeType === "PERCENTAGE" ? "(%)" : "(€)"}{" "}
                    <span className="text-gray-600">— pozitive për ngritje, negative për ulje</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={changeValue}
                    onChange={(e) => setChangeValue(e.target.value)}
                    placeholder={changeType === "PERCENTAGE" ? "p.sh. 5 ose -3" : "p.sh. 0.50 ose -0.20"}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Arsyeja (opsionale)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="p.sh. Rritje sezonale e çmimeve..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    className="text-gray-400"
                  >
                    Anulo
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? "Duke aplikuar..." : `Apliko tek të gjithë (${productIds.length})`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
