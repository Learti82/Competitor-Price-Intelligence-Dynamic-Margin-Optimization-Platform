"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";

interface PricePoint {
  date: string;
  price: number;
}

interface CompetitorPrices {
  name: string;
  prices: PricePoint[];
}

interface PriceHistoryChartProps {
  ourPrices: PricePoint[];
  competitorPrices: CompetitorPrices[];
}

const COMPETITOR_COLORS = [
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

function mergeByDate(
  ourPrices: PricePoint[],
  competitorPrices: CompetitorPrices[]
): Record<string, unknown>[] {
  const dateMap: Record<string, Record<string, unknown>> = {};

  for (const p of ourPrices) {
    if (!dateMap[p.date]) dateMap[p.date] = { date: p.date };
    dateMap[p.date]["ourPrice"] = p.price;
  }

  for (const comp of competitorPrices) {
    for (const p of comp.prices) {
      if (!dateMap[p.date]) dateMap[p.date] = { date: p.date };
      dateMap[p.date][comp.name] = p.price;
    }
  }

  return Object.values(dateMap).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs shadow-xl">
        <p className="text-gray-400 mb-2">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
            {entry.name}: €{Number(entry.value).toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PriceHistoryChart({ ourPrices, competitorPrices }: PriceHistoryChartProps) {
  const data = mergeByDate(ourPrices, competitorPrices);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        Nuk ka të dhëna të çmimeve për periudhën e zgjedhur.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="ourPriceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            try {
              return format(new Date(v), "dd MMM");
            } catch {
              return v;
            }
          }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `€${v}`}
          domain={["auto", "auto"]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
          formatter={(value) => (
            <span style={{ color: "#9ca3af" }}>{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="ourPrice"
          name="Çmimi juaj"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#ourPriceGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#3b82f6" }}
          connectNulls
        />
        {competitorPrices.map((comp, i) => (
          <Area
            key={comp.name}
            type="monotone"
            dataKey={comp.name}
            name={comp.name}
            stroke={COMPETITOR_COLORS[i % COMPETITOR_COLORS.length]}
            strokeWidth={1.5}
            fill="none"
            dot={false}
            activeDot={{ r: 3 }}
            connectNulls
            strokeDasharray="4 2"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
