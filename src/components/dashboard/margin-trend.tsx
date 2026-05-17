"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";

interface MarginPoint {
  recordedAt: Date;
  margin: number;
}

function aggregateByDay(history: MarginPoint[]) {
  const byDay: Record<string, number[]> = {};

  for (const point of history) {
    const day = format(new Date(point.recordedAt), "MMM dd");
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(point.margin);
  }

  return Object.entries(byDay)
    .map(([day, margins]) => ({
      day,
      margin: parseFloat((margins.reduce((a, b) => a + b, 0) / margins.length).toFixed(2)),
    }))
    .slice(-30);
}

export function MarginTrend({ marginHistory }: { marginHistory: MarginPoint[] }) {
  const data = aggregateByDay(marginHistory);
  const avgMargin = data.length
    ? data.reduce((a, b) => a + b.margin, 0) / data.length
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs shadow-xl">
          <p className="text-gray-400 mb-1">{label}</p>
          <p className="text-white font-semibold">
            Marzhi mesatar: {payload[0].value.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              Trendi i Marzhit — 30 Ditët e Fundit
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Mesatarja e marzhit për të gjitha produktet aktive
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{avgMargin.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Marzhi aktual mesatar</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="day"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgMargin}
              stroke="#3b82f6"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="margin"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#a855f7" }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-3 flex items-center gap-6 text-xs text-gray-600 border-t border-gray-800 pt-3">
          <span className="flex items-center gap-1.5">
            <span className="h-px w-6 bg-purple-500" /> Marzhi juaj
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-px w-6 bg-blue-500 border-dashed border-t" /> Mesatarja
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
