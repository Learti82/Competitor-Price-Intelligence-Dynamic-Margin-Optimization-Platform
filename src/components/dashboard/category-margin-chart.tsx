"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface CategoryMarginData {
  category: string;
  label: string;
  avgMargin: number;
}

interface CategoryMarginChartProps {
  data: CategoryMarginData[];
}

function getBarColor(margin: number): string {
  if (margin < 3) return "#ef4444";
  if (margin < 8) return "#eab308";
  if (margin < 15) return "#22c55e";
  return "#10b981";
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const margin = payload[0].value;
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs shadow-xl">
        <p className="text-gray-300 font-semibold mb-1">{label}</p>
        <p style={{ color: getBarColor(margin) }}>
          Marzhi mesatar: {margin.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export function CategoryMarginChart({ data }: CategoryMarginChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        Nuk ka të dhëna të kategorive.
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.avgMargin - a.avgMargin);

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, sorted.length * 36)}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          domain={[0, "auto"]}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={130}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="avgMargin" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {sorted.map((entry, index) => (
            <Cell key={index} fill={getBarColor(entry.avgMargin)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
