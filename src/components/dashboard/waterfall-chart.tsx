"use client";

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

export interface WaterfallStep {
  name: string;
  value: number;
  start: number;
  isTotal: boolean;
  color: string;
}

interface WaterfallChartProps {
  steps: WaterfallStep[];
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: WaterfallStep }>;
}) => {
  if (active && payload && payload.length) {
    const step = payload[0].payload;
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs shadow-xl">
        <p className="text-white font-semibold mb-1">{step.name}</p>
        <p style={{ color: step.color }}>
          {step.value < 0 ? "-" : ""}€{Math.abs(step.value).toLocaleString("sq-AL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      </div>
    );
  }
  return null;
};

export function WaterfallChart({ steps }: WaterfallChartProps) {
  // Build recharts data: invisible bar (start) + visible bar (value)
  const data = steps.map((s) => ({
    ...s,
    invisible: s.isTotal ? 0 : Math.min(s.start, s.start + s.value),
    visible: Math.abs(s.value),
    displayStart: s.isTotal ? 0 : Math.min(s.start, s.start + s.value),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        {/* Invisible spacer bar */}
        <Bar dataKey="invisible" stackId="waterfall" fill="transparent" />
        {/* Visible value bar */}
        <Bar dataKey="visible" stackId="waterfall" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
          <LabelList
            dataKey="visible"
            position="top"
            formatter={(v: number) => `€${(v / 1000).toFixed(1)}k`}
            style={{ fill: "#9ca3af", fontSize: 11 }}
          />
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
