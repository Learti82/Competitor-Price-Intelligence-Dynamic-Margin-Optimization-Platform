"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const PRODUCTS = [
  { id: "1", name: "Jogurt Alpina 400g", currentPrice: 1.29, elasticity: -1.4 },
  { id: "2", name: "Ujë Rugove 1.5L", currentPrice: 0.75, elasticity: -0.8 },
  { id: "3", name: "Kafe Bona 200g", currentPrice: 4.99, elasticity: -0.5 },
  { id: "4", name: "Coca-Cola 2L", currentPrice: 1.89, elasticity: -1.8 },
];

function generateCurve(currentPrice: number, elasticity: number) {
  const baseVolume = 100;
  const points = [];
  for (let pct = -20; pct <= 20; pct += 2) {
    const price = currentPrice * (1 + pct / 100);
    const volume = baseVolume * Math.pow(1 + pct / 100, elasticity);
    const revenue = price * volume;
    points.push({
      price: parseFloat(price.toFixed(2)),
      volume: Math.round(volume),
      revenue: Math.round(revenue),
      pct,
    });
  }
  return points;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs shadow-xl">
      <p className="text-gray-400">Çmimi: <span className="text-white font-semibold">€{d.price}</span></p>
      <p className="text-gray-400">Volumi relativ: <span className="text-blue-400 font-semibold">{d.volume}%</span></p>
      <p className="text-gray-400">Të ardhurat: <span className="text-green-400 font-semibold">{d.revenue}</span></p>
      <p className="text-gray-500">Ndryshimi: {d.pct > 0 ? "+" : ""}{d.pct}%</p>
    </div>
  );
}

export function ElasticityChart() {
  const [selected, setSelected] = useState(PRODUCTS[0]);
  const data = generateCurve(selected.currentPrice, selected.elasticity);
  const currentPoint = data.find((d) => d.pct === 0);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-sm font-semibold text-white">
              Elasticiteti i Çmimit
            </CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Si ndikon ndryshimi i çmimit te volumi i shitjeve
            </p>
          </div>
          <select
            value={selected.id}
            onChange={(e) => setSelected(PRODUCTS.find((p) => p.id === e.target.value)!)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex gap-4">
          <div className="rounded-lg bg-gray-800 px-3 py-2 text-center">
            <p className="text-[10px] text-gray-500">Elasticiteti</p>
            <p className="text-sm font-bold text-blue-400">{selected.elasticity}</p>
          </div>
          <div className="rounded-lg bg-gray-800 px-3 py-2 text-center">
            <p className="text-[10px] text-gray-500">Çmimi aktual</p>
            <p className="text-sm font-bold text-white">€{selected.currentPrice}</p>
          </div>
          <div className="rounded-lg bg-gray-800 px-3 py-2 text-center">
            <p className="text-[10px] text-gray-500">Lloji</p>
            <p className="text-sm font-bold text-yellow-400">
              {Math.abs(selected.elasticity) < 1 ? "Inelastik" : "Elastik"}
            </p>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="pct" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false}
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke="#3b82f6" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="volume" stroke="#60a5fa" strokeWidth={2}
                dot={false} name="Volumi" />
              <Line type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2}
                dot={false} name="Të ardhurat" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="h-2 w-4 rounded-full bg-blue-400" /> Volumi
          </span>
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="h-2 w-4 rounded-full bg-green-400" /> Të ardhurat
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
