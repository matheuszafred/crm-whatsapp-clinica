"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Point { date: string; clicks: number; impressions: number; }

export function SeoTimelineChart({ data }: { data: Point[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#aaa" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: "#aaa" }} tickLine={false} axisLine={false} yAxisId="clicks" />
        <YAxis tick={{ fontSize: 10, fill: "#aaa" }} tickLine={false} axisLine={false} yAxisId="imp" orientation="right" />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #f0f0f0" }}
          formatter={(v, name) => [(v as number).toLocaleString("pt-BR"), name === "clicks" ? "Cliques" : "Impressões"]}
          labelFormatter={(l) => `Data: ${l}`}
        />
        <Legend formatter={(v) => v === "clicks" ? "Cliques" : "Impressões"} wrapperStyle={{ fontSize: 11 }} />
        <Line yAxisId="clicks" type="monotone" dataKey="clicks" stroke="#457ee7" strokeWidth={2} dot={false} />
        <Line yAxisId="imp" type="monotone" dataKey="impressions" stroke="#e2a84b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}
