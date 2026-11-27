"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Point {
  date: string;
  leads: number;
}

export function LeadsTimelineChart({ data }: { data: Point[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm" style={{ color: "#aaa" }}>
        Sem leads no período
      </div>
    );
  }

  // "2026-08-11" → "08-11": eixo curto cabe no mobile.
  const formatted = data.map((d) => ({ ...d, label: d.date.slice(5) }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={formatted} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#aaa" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#aaa" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "#f0fdf4" }}
          contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #f0f0f0" }}
          formatter={(v) => [`${v} lead${v === 1 ? "" : "s"}`, "Novos"]}
          labelFormatter={(l) => `Dia ${l}`}
        />
        <Bar dataKey="leads" fill="#25d366" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
