"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus, Store } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Store {
  id: string;
  name: string;
  city: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  currentPrice: number;
}

interface Override {
  id: string;
  price: number;
  store: { id: string; name: string };
  product: { id: string; name: string; sku: string; currentPrice: number };
}

interface StorePricesClientProps {
  stores: Store[];
  products: Product[];
  initialOverrides: Override[];
}

export function StorePricesClient({ stores, products, initialOverrides }: StorePricesClientProps) {
  const [overrides, setOverrides] = useState<Override[]>(initialOverrides);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(priceInput);
    if (!selectedStore || !selectedProduct || isNaN(price) || price <= 0) {
      toast.error("Plotëso të gjitha fushat me vlera të vlefshme.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/store-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: selectedStore, productId: selectedProduct, price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gabim");
      toast.success("Zëvendësimi u shtua me sukses!");

      // Refresh list
      const listRes = await fetch("/api/store-prices");
      const listData = await listRes.json();
      if (listData.prices) setOverrides(listData.prices);

      setSelectedStore("");
      setSelectedProduct("");
      setPriceInput("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/store-prices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gabim");
      toast.success("Zëvendësimi u fshi");
      setOverrides((prev) => prev.filter((o) => o.id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gabim i panjohur");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add override form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-400" />
            Shto Zëvendësim Çmimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              required
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">Zgjidh Dyqanin...</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.city}
                </option>
              ))}
            </select>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              required
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">Zgjidh Produktin...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Çmimi (€)"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              required
              className="w-36 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
            <Button
              type="submit"
              disabled={adding}
              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
            >
              {adding ? "Duke shtuar..." : "Shto"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Overrides table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Store className="h-4 w-4 text-gray-400" />
            Zëvendësimet Ekzistuese ({overrides.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overrides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Store className="h-10 w-10 text-gray-700" />
              <p className="text-sm text-gray-500">
                Nuk keni zëvendësime çmimesh. Të gjithë dyqanet përdorin çmimin bazë.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500">
                    <th className="text-left py-2 pr-4">Dyqani</th>
                    <th className="text-left py-2 pr-4">Produkti</th>
                    <th className="text-left py-2 pr-4">Çmimi i Zëvendësuar</th>
                    <th className="text-left py-2 pr-4">Çmimi Bazë</th>
                    <th className="text-left py-2 pr-4">Diferenca %</th>
                    <th className="text-left py-2">Veprim</th>
                  </tr>
                </thead>
                <tbody>
                  {overrides.map((ov) => {
                    const diff = ((ov.price - ov.product.currentPrice) / ov.product.currentPrice) * 100;
                    const diffColor = diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-gray-400";
                    return (
                      <tr key={ov.id} className="border-b border-gray-800/50 last:border-0">
                        <td className="py-3 pr-4 text-white text-xs font-medium">{ov.store.name}</td>
                        <td className="py-3 pr-4 text-gray-300 text-xs">{ov.product.name}</td>
                        <td className="py-3 pr-4 text-white font-semibold text-xs">
                          {formatCurrency(ov.price)}
                        </td>
                        <td className="py-3 pr-4 text-gray-400 text-xs">
                          {formatCurrency(ov.product.currentPrice)}
                        </td>
                        <td className={`py-3 pr-4 text-xs font-medium ${diffColor}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={deletingId === ov.id}
                            onClick={() => handleDelete(ov.id)}
                            className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
