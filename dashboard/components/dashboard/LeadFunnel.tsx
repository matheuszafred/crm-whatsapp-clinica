"use client";

interface StagePoint {
  stage: string;
  label: string;
  leads: number;
  pct: number;
}

const STAGE_COLORS: Record<string, string> = {
  novo: "#457ee7",
  em_atendimento: "#f59e0b",
  agendado: "#8b5cf6",
  compareceu: "#22c55e",
  perdido: "#94a3b8",
};

export function LeadFunnel({ data }: { data: StagePoint[] }) {
  const total = data.reduce((acc, d) => acc + d.leads, 0);

  if (!total) {
    return (
      <div className="flex items-center justify-center h-24 text-sm" style={{ color: "#aaa" }}>
        Sem leads no período
      </div>
    );
  }

  // 'perdido' não é um degrau do funil, é saída — vai separado no rodapé.
  const steps = data.filter((d) => d.stage !== "perdido");
  const perdido = data.find((d) => d.stage === "perdido");

  return (
    <div className="space-y-2.5">
      {steps.map((d) => (
        <div key={d.stage}>
          <div className="flex items-baseline justify-between text-xs mb-1">
            <span style={{ color: "#555" }}>{d.label}</span>
            <span style={{ color: "#888" }}>
              <span className="font-semibold" style={{ color: "#282828" }}>
                {d.leads}
              </span>{" "}
              · {d.pct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(d.pct, d.leads > 0 ? 2 : 0)}%`,
                backgroundColor: STAGE_COLORS[d.stage] ?? "#94a3b8",
              }}
            />
          </div>
        </div>
      ))}

      {perdido && (
        <div className="pt-2 mt-1 border-t border-gray-100 flex items-baseline justify-between text-xs">
          <span style={{ color: "#888" }}>Perdidos</span>
          <span style={{ color: "#888" }}>
            <span className="font-semibold" style={{ color: "#94a3b8" }}>
              {perdido.leads}
            </span>{" "}
            · {perdido.pct}%
          </span>
        </div>
      )}

      <p className="text-[11px] pt-1" style={{ color: "#aaa" }}>
        Estágio atual dos {total} lead{total === 1 ? "" : "s"} que entraram no período.
      </p>
    </div>
  );
}
