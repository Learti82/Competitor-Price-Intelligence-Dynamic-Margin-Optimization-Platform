"use client";

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Label,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductPoint {
  name: string;
  priceIndex: number;
  margin: number;
  category: string;
}

const DEMO_DATA: ProductPoint[] = [
  { name: "Jogurt Alpina 400g", priceIndex: 102, margin: 18, category: "Bulmet" },
  { name: "Qumësht 1L", priceIndex: 98, margin: 12, category: "Bulmet" },
  { name: "Ujë Rugove 1.5L", priceIndex: 95, margin: 22, category: "Pije" },
  { name: "Coca-Cola 2L", priceIndex: 105, margin: 15, category: "Pije" },
  { name: "Bukë e bardhë 500g", priceIndex: 97, margin: 8, category: "Bukëpjekje" },
  { name: "Vaj luledieli 1L", priceIndex: 103, margin: 11, category: "Vaj" },
  { name: "Sheqer 1kg", priceIndex: 100, margin: 6, category: "Ushqim" },
  { name: "Miell 1kg", priceIndex: 96, margin: 5, category: "Drithëra" },
  { name: "Sapun Dove 90g", priceIndex: 108, margin: 28, category: "Kujdes" },
  { name: "Shampoo H&S", priceIndex: 104, margin: 31, category: "Kujdes" },
  { name: "Djath i bardhë 300g", priceIndex: 99, margin: 19, category: "Bulmet" },
  { name: "Salsiçe 300g", priceIndex: 106, margin: 14, category: "Mish" },
  { name: "Makarona 500g", priceIndex: 94, margin: 16, category: "Drithëra" },
  { name: "Kafe Bona 200g", priceIndex: 101, margin: 34, category: "Kafe" },
  { name: "Çaj Lipton 25 qese", priceIndex: 107, margin: 36, category: "Kafe" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Bulmet: "#60a5fa", Pije: "#34d399", Bukëpjekje: "#f59e0b",
  Vaj: "#f97316", Ushqim: "#a78bfa", Drithëra: "#fb7185",
  Kujdes: "#22d3ee", Mish: "#e879f9", Kafe: "#fbbf24",
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ProductPoint;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs shadow-xl">
      <p className="font-semibold text-white mb-1">{d.name}</p>
      <p className="text-gray-400">Indeksi i çmimit: <span className="text-white">{d.priceIndex}%</span></p>
      <p className="text-gray-400">Marzhi: <span className="text-green-400">{d.margin}%</span></p>
      <p className="text-gray-400">Kategoria: <span className="text-blue-400">{d.category}</span></p>
    </div>
  );
}

export function MarketPositionChart() {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-white">
          Pozicioni i Tregut — Çmimi vs Marzhi
        </CardTitle>
        <p className="text-xs text-gray-500">
          Çdo pikë = produkt. Indeksi 100 = çmim mesatar i konkurrentëve.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                type="number" dataKey="priceIndex"
                domain={[88, 115]} tick={{ fill: "#6b7280", fontSize: 11 }}
                tickLine={false}
              >
                <Label value="Indeksi i Çmimit (%)" offset={-10} position="insideBottom" fill="#6b7280" fontSize={11} />
              </XAxis>
              <YAxis
                type="number" dataKey="margin"
                domain={[0, 45]} tick={{ fill: "#6b7280", fontSize: 11 }}
                tickLine={false} width={35}
              >
                <Label value="Marzhi (%)" angle={-90} position="insideLeft" fill="#6b7280" fontSize={11} />
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={100} stroke="#374151" strokeDasharray="4 4" />
              <ReferenceLine y={15} stroke="#374151" strokeDasharray="4 4" />
              <Scatter
                data={DEMO_DATA}
                fill="#60a5fa"
                shape={(props: any) => {
                  const color = CATEGORY_COLORS[props.payload.category] ?? "#60a5fa";
                  return <circle cx={props.cx} cy={props.cy} r={6} fill={color} fillOpacity={0.8} stroke={color} strokeWidth={1} />;
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <span key={cat} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {cat}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
