"use client";

import { MessageCircle, Clock, Radio } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm-store";
import {
  LEAD_INTERESTS,
  LEAD_INTEREST_LABELS,
  LEAD_STAGES,
  LOSS_REASONS,
  LOSS_REASON_LABELS,
  STAGE_LABELS,
  STAGE_STYLES,
  formatarTelefone,
  iniciais,
  textoParado,
  type Lead,
} from "@/lib/crm-labels";

/**
 * Painel de classificação de um lead. Usado nas duas abas — na Conversas como
 * coluna da direita, no Pipeline dentro de uma gaveta.
 *
 * ⚠️ Não mostra o histórico de mensagens porque o sistema **não guarda** conteúdo
 * de conversa: a tabela existe e nunca foi ligada, e ligar é decisão de LGPD em
 * aberto. Quem lê a conversa é o WhatsApp — daí o botão abaixo
 * ser a ação principal, e não um detalhe.
 */
export function LeadDetail({ lead }: { lead: Lead }) {
  const { classificar, salvandoId } = useCrm();
  const ocupado = salvandoId === lead.id;
  const perdido = lead.stage === "perdido";
  const sigla = iniciais(lead.name);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-3 p-5">
        <Avatar className="size-10">
          <AvatarFallback className="text-xs font-medium">
            {sigla ?? <MessageCircle className="size-4" />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold leading-tight">
            {lead.name || formatarTelefone(lead.phone)}
          </h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground tabular-nums">
            {formatarTelefone(lead.phone)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Radio className="size-3" /> {lead.originLabel}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1",
                lead.diasParado >= 7 && "font-medium text-amber-700",
              )}
            >
              <Clock className="size-3" /> sem responder há {textoParado(lead.diasParado)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5">
        {/* nativeButton={false} porque isto renderiza como <a>: sem avisar o Base
            UI, ele mantém a semântica de <button> num link e quebra leitor de tela
            e navegação por teclado. */}
        <Button
          size="lg"
          nativeButton={false}
          className="w-full bg-[#25d366] text-white hover:bg-[#1eb85a]"
          render={
            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <MessageCircle />
          Abrir conversa no WhatsApp
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          O histórico fica no WhatsApp — o sistema não guarda mensagem.
        </p>
      </div>

      <Separator className="my-5" />

      <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-6">
        <Campo titulo="O que aconteceu">
          <div className="grid grid-cols-2 gap-1.5">
            {LEAD_STAGES.map((s) => (
              <Opcao
                key={s}
                label={STAGE_LABELS[s]}
                ativo={lead.stage === s}
                disabled={ocupado}
                onClick={() => classificar(lead, { stage: s })}
              />
            ))}
          </div>
        </Campo>

        {perdido && (
          <Campo titulo="Por quê">
            <div className="grid grid-cols-2 gap-1.5">
              {LOSS_REASONS.map((m) => (
                <Opcao
                  key={m}
                  label={LOSS_REASON_LABELS[m]}
                  ativo={lead.lossReason === m}
                  disabled={ocupado}
                  onClick={() => classificar(lead, { lossReason: m })}
                />
              ))}
            </div>
          </Campo>
        )}

        <Campo titulo="O que procura">
          <div className="grid grid-cols-2 gap-1.5">
            {LEAD_INTERESTS.map((p) => (
              <Opcao
                key={p}
                label={LEAD_INTEREST_LABELS[p]}
                ativo={lead.interest === p}
                disabled={ocupado}
                onClick={() => classificar(lead, { interest: p })}
              />
            ))}
          </div>
        </Campo>

        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
          <span className={cn("size-2 shrink-0 rounded-full", STAGE_STYLES[lead.stage].dot)} />
          <span className="text-xs text-muted-foreground">
            Agora: <span className="font-medium text-foreground">{STAGE_LABELS[lead.stage]}</span>
            {lead.lossReason && ` · ${LOSS_REASON_LABELS[lead.lossReason]}`}
          </span>
        </div>
      </div>
    </div>
  );
}

function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      {children}
    </div>
  );
}

/**
 * Botão de escolha. Altura de 40px porque a secretária classifica no celular, no
 * meio do atendimento — alvo pequeno faz ela errar e desistir da tela.
 */
function Opcao({
  label,
  ativo,
  disabled,
  onClick,
}: {
  label: string;
  ativo: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ativo}
      className={cn(
        "flex min-h-10 items-center justify-center rounded-md border px-2.5 text-center text-[0.8rem] font-medium leading-tight transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:pointer-events-none disabled:opacity-50",
        ativo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
