"use client";

interface Query {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}

export function SeoQueriesTable({ data, title }: { data: Query[]; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#888" }}>{title}</p>
      <div className="space-y-2">
        {data.map((row, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm font-medium truncate" style={{ color: "#282828" }}>{row.query}</p>
              <p className="text-xs mt-0.5" style={{ color: "#aaa" }}>{row.impressions.toLocaleString("pt-BR")} impressões</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: "#457ee7" }}>{row.clicks}</p>
                <p className="text-xs" style={{ color: "#aaa" }}>cliques</p>
              </div>
              <div className="text-right w-10">
                <p className="text-sm font-semibold" style={{ color: row.position <= 3 ? "#22c55e" : row.position <= 10 ? "#f59e0b" : "#ef4444" }}>
                  #{row.position}
                </p>
                <p className="text-xs" style={{ color: "#aaa" }}>pos</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
