"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Search, RefreshCw, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm-store";
import { LeadDetail } from "@/app/crm/_components/lead-detail";
import { PageHeader } from "@/components/page-header";
import {
  ESTAGIOS_ABERTOS,
  PARADO_DIAS,
  STAGE_LABELS,
  STAGE_STYLES,
  formatarTelefone,
  precisaRetorno,
  textoParado,
  type Lead,
} from "@/lib/crm-labels";

// Recorte da lista. "Retornar" é o padrão porque é a pergunta com que a
// secretária abre o dia: quem sumiu e ainda está em jogo.
const RECORTES = [
  { id: "retornar", label: "A retornar" },
  { id: "abertos", label: "Em aberto" },
  { id: "todos", label: "Todos" },
] as const;

type Recorte = (typeof RECORTES)[number]["id"];

export default function ConversasPage() {
  const { leads, carregando, erro, recarregar } = useCrm();
  const isMobile = useIsMobile();

  const [recorte, setRecorte] = useState<Recorte>("retornar");
  const [busca, setBusca] = useState("");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, "");

    return leads
      .filter((l) => {
        if (recorte === "retornar") return precisaRetorno(l);
        if (recorte === "abertos") return ESTAGIOS_ABERTOS.includes(l.stage);
        return true;
      })
      .filter((l) => {
        if (!termo) return true;
        const nome = (l.name ?? "").toLowerCase();
        // Busca por telefone ignora formatação: quem digita "99191" quer achar
        // (11) 99191-9553.
        return nome.includes(termo) || (digitos.length > 0 && l.phone.includes(digitos));
      })
      .sort((a, b) => b.diasParado - a.diasParado);
  }, [leads, recorte, busca]);

  // Seleção derivada no render, sem efeito de sincronização.
  //
  // O id escolhido pode sair da lista a qualquer momento — a secretária troca o
  // recorte, digita na busca, ou classifica um lead e ele deixa de ser "a
  // retornar". Sincronizar isso por efeito custava um render extra a cada
  // mudança e deixava a tela num estado intermediário. Derivar resolve na hora:
  // no computador cai no primeiro da lista, no celular não abre nada sozinho
  // (lá o detalhe é uma gaveta, e abrir sozinho tamparia a lista).
  const selecionado =
    lista.find((l) => l.id === selecionadoId) ?? (isMobile ? null : lista[0] ?? null);
  const aRetornar = leads.filter(precisaRetorno).length;

  return (
    <div className="flex h-svh flex-col">
      <PageHeader
        titulo="Conversas"
        descricao={
          carregando
            ? "Carregando…"
            : `${aRetornar} a retornar · ${leads.length} na base`
        }
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

      <div className="flex min-h-0 flex-1">
        {/* Coluna da lista */}
        <div className="flex min-h-0 w-full flex-col border-r md:w-[22rem] lg:w-[24rem]">
          <div className="space-y-2.5 border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou telefone"
                className="h-8 pl-8 text-sm"
              />
            </div>
            <div className="flex gap-1">
              {RECORTES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRecorte(r.id)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    recorte === r.id
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {carregando && (
              <div className="space-y-1 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {!carregando && lista.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                <Inbox className="size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">
                  {busca ? "Ninguém encontrado" : "Nada para retornar"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {busca
                    ? "Tente outro nome ou telefone."
                    : `Sem ninguém parado há ${PARADO_DIAS} dias ou mais.`}
                </p>
              </div>
            )}

            {!carregando &&
              lista.map((lead) => (
                <LinhaLead
                  key={lead.id}
                  lead={lead}
                  ativo={lead.id === selecionadoId}
                  onClick={() => setSelecionadoId(lead.id)}
                />
              ))}
          </div>
        </div>

        {/* Coluna do detalhe — no celular vira gaveta */}
        {!isMobile && (
          <div className="min-w-0 flex-1 overflow-y-auto">
            {selecionado ? (
              <LeadDetail lead={selecionado} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                <Inbox className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Escolha uma conversa para classificar.
                </p>
              </div>
            )}
          </div>
        )}

        {isMobile && (
          <Sheet
            open={Boolean(selecionado)}
            onOpenChange={(aberto) => !aberto && setSelecionadoId(null)}
          >
            <SheetContent side="bottom" className="h-[92svh] overflow-y-auto p-0">
              <SheetTitle className="sr-only">Classificar lead</SheetTitle>
              {selecionado && <LeadDetail lead={selecionado} />}
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}

function LinhaLead({
  lead,
  ativo,
  onClick,
}: {
  lead: Lead;
  ativo: boolean;
  onClick: () => void;
}) {
  const estilo = STAGE_STYLES[lead.stage];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2.5 border-b px-3 py-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        ativo ? "bg-muted" : "hover:bg-muted/50",
      )}
    >
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", estilo.dot)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium">
            {lead.name || formatarTelefone(lead.phone)}
          </span>
          <span
            className={cn(
              "shrink-0 text-xs tabular-nums",
              lead.diasParado >= 7 ? "font-medium text-amber-700" : "text-muted-foreground",
            )}
          >
            {textoParado(lead.diasParado)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{lead.originLabel}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{STAGE_LABELS[lead.stage]}</span>
        </div>
      </div>
    </button>
  );
}
