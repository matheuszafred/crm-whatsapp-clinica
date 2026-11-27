"use client";

import { useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm-store";
import { LeadDetail } from "@/app/crm/_components/lead-detail";
import { PageHeader } from "@/components/page-header";
import {
  LEAD_STAGES,
  STAGE_LABELS,
  STAGE_STYLES,
  formatarTelefone,
  textoParado,
  type Lead,
  type LeadStage,
} from "@/lib/crm-labels";

/**
 * Quadro do funil: uma coluna por estágio, na ordem do pipeline.
 *
 * Arrastar funciona no computador (drag-and-drop nativo do navegador, que não
 * existe no toque). No celular o caminho é tocar no cartão e escolher o estágio
 * na gaveta — e é esse o caminho que a secretária usa de fato, então ele não pode
 * ser o plano B mal-acabado.
 */
export default function PipelinePage() {
  const { leads, carregando, erro, recarregar, classificar } = useCrm();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<LeadStage | null>(null);
  const [abertoId, setAbertoId] = useState<string | null>(null);

  const colunas = useMemo(() => {
    return LEAD_STAGES.map((stage) => ({
      stage,
      leads: leads
        .filter((l) => l.stage === stage)
        .sort((a, b) => b.diasParado - a.diasParado),
    }));
  }, [leads]);

  const aberto = leads.find((l) => l.id === abertoId) ?? null;

  function soltar(stage: LeadStage) {
    const lead = leads.find((l) => l.id === arrastando);
    setArrastando(null);
    setAlvo(null);
    if (lead && lead.stage !== stage) void classificar(lead, { stage });
  }

  return (
    <div className="flex h-svh flex-col">
      <PageHeader
        titulo="Pipeline"
        descricao={carregando ? "Carregando…" : `${leads.length} leads no funil`}
        acoes={
          <Button variant="ghost" size="icon-sm" onClick={recarregar} aria-label="Atualizar">
            <RefreshCw className={cn(carregando && "animate-spin")} />
          </Button>
        }
      />

      {erro && (
        <div className="flex items-center gap-2 border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{erro}</span>
          <Button variant="ghost" size="xs" onClick={recarregar}>
            Tentar de novo
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden bg-muted/30">
        <div className="flex h-full min-w-max gap-3 p-3">
          {colunas.map(({ stage, leads: doEstagio }) => {
            const estilo = STAGE_STYLES[stage];
            const destacado = alvo === stage && arrastando !== null;

            return (
              <section
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  setAlvo(stage);
                }}
                onDragLeave={() => setAlvo((a) => (a === stage ? null : a))}
                onDrop={() => soltar(stage)}
                className={cn(
                  "flex h-full w-[16.5rem] shrink-0 flex-col rounded-lg border bg-background transition-colors",
                  destacado && "border-primary bg-primary/5",
                )}
              >
                <header className="flex items-center gap-2 border-b px-3 py-2.5">
                  <span className={cn("size-2 shrink-0 rounded-full", estilo.dot)} />
                  <h2 className="flex-1 truncate text-sm font-medium">{STAGE_LABELS[stage]}</h2>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {doEstagio.length}
                  </span>
                </header>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
                  {carregando &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-[4.5rem] w-full" />
                    ))}

                  {!carregando && doEstagio.length === 0 && (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                      Nenhum lead aqui.
                    </p>
                  )}

                  {!carregando &&
                    doEstagio.map((lead) => (
                      <CartaoLead
                        key={lead.id}
                        lead={lead}
                        arrastando={arrastando === lead.id}
                        onDragStart={() => setArrastando(lead.id)}
                        onDragEnd={() => {
                          setArrastando(null);
                          setAlvo(null);
                        }}
                        onClick={() => setAbertoId(lead.id)}
                      />
                    ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <Sheet open={Boolean(aberto)} onOpenChange={(a) => !a && setAbertoId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
          <SheetTitle className="sr-only">Classificar lead</SheetTitle>
          {aberto && <LeadDetail lead={aberto} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CartaoLead({
  lead,
  arrastando,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  lead: Lead;
  arrastando: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "w-full rounded-md border bg-card p-2.5 text-left shadow-xs transition-all",
        "hover:border-muted-foreground/30 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        arrastando && "opacity-40",
      )}
    >
      <p className="truncate text-sm font-medium leading-tight">
        {lead.name || formatarTelefone(lead.phone)}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{lead.originLabel}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-xs tabular-nums",
            lead.diasParado >= 7 ? "font-medium text-amber-700" : "text-muted-foreground",
          )}
        >
          {textoParado(lead.diasParado)}
        </span>
        {lead.interest && (
          <span className="truncate rounded bg-muted px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">
            {lead.interest}
          </span>
        )}
      </div>
    </button>
  );
}
