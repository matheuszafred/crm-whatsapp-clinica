import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  LEAD_INTERESTS,
  LEAD_STAGES,
  LOSS_REASONS,
  ORIGIN_LABELS,
  type CrmData,
  type Lead,
  type LeadInterest,
  type LeadOrigin,
  type LeadStage,
  type LossReason,
} from "@/lib/crm-labels";

// ⚠️ SERVER-ONLY. Usa a service_role key e NUNCA pode ser importado por um
// Client Component — só via app/api/crm/route.ts.
//
// ⚠️ DIFERENÇA CRÍTICA PARA lib/operacao.ts: lá sai só agregado, nenhum dado de
// pessoa. Aqui saem NOME e TELEFONE de paciente, porque a secretária precisa
// saber para quem ligar. Enquanto o dashboard for público, esta rota não pode
// ficar acessível — ver proxy.ts (controle de acesso).

let client: SupabaseClient | null = null;

function getServerClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    const missing = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !key ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter(Boolean);

    throw new Error(`Supabase env ausente: ${missing.join(" e ")}`);
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

/** Estágios em que o lead ainda está em jogo — os que entram na lista de retorno. */
const ABERTOS: LeadStage[] = ["novo", "em_atendimento"];

interface ContactRow {
  id: string;
  phone: string;
  name: string | null;
  origin: LeadOrigin;
  current_stage: LeadStage;
  loss_reason: LossReason | null;
  interest: LeadInterest | null;
  last_seen: string;
}

function toLead(r: ContactRow): Lead {
  return {
    id: r.id,
    phone: r.phone,
    name: r.name,
    origin: r.origin,
    originLabel: ORIGIN_LABELS[r.origin] ?? r.origin,
    stage: r.current_stage,
    lossReason: r.loss_reason,
    interest: r.interest,
    lastSeen: r.last_seen,
    diasParado: Math.floor((Date.now() - new Date(r.last_seen).getTime()) / 86_400_000),
  };
}

const CAMPOS = "id,phone,name,origin,current_stage,loss_reason,interest,last_seen";

/**
 * Lista da tela.
 *
 * `filtro: "retornar"` é a visão do dia: quem ainda está em jogo e sumiu há mais
 * de `paradoHa` dias, do mais parado para o menos.
 *
 * NOTA sobre `last_seen`: ele só avança quando o LEAD escreve — resposta da
 * secretária sai do celular dela e não passa pelo Baileys. Para "precisa de
 * retorno" esse é justamente o sinal certo: mede há quanto tempo a pessoa sumiu,
 * não há quanto tempo alguém mexeu no registro.
 */
export async function getCrmLeads(
  filtro: "retornar" | "abertos" | "todos" = "retornar",
  paradoHa = 3,
): Promise<CrmData> {
  const supabase = getServerClient();
  const corte = new Date(Date.now() - paradoHa * 86_400_000).toISOString();

  let query = supabase.from("contacts").select(CAMPOS);

  if (filtro === "retornar") {
    query = query.in("current_stage", ABERTOS).lt("last_seen", corte);
  } else if (filtro === "abertos") {
    query = query.in("current_stage", ABERTOS);
  }

  // Mais parado primeiro na visão de retorno; mais recente primeiro nas outras.
  const { data, error } = await query
    .order("last_seen", { ascending: filtro !== "todos" })
    .range(0, 499);
  if (error) throw error;

  // Contadores do cabeçalho. `head: true` traz só a contagem, sem linha nenhuma.
  const [{ count: totalRetornar }, { count: totalAbertos }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .in("current_stage", ABERTOS)
      .lt("last_seen", corte),
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .in("current_stage", ABERTOS),
  ]);

  return {
    leads: ((data ?? []) as ContactRow[]).map(toLead),
    totalRetornar: totalRetornar ?? 0,
    totalAbertos: totalAbertos ?? 0,
  };
}

export interface Classificacao {
  stage?: LeadStage;
  lossReason?: LossReason | null;
  interest?: LeadInterest | null;
}

/**
 * Grava a classificação feita na tela.
 *
 * Duas regras que moram aqui e não no banco:
 *
 * 1. `loss_reason` só vale com estágio `perdido`. A migration 0003 deliberadamente
 *    NÃO tem CHECK para isso — um CHECK faria o UPDATE explodir na cara da
 *    secretária quando ela movesse um lead de volta para "atendendo". Então quem
 *    limpa é aqui.
 * 2. Toda mudança de estágio vira linha em `pipeline_events`, senão o funil perde
 *    a auditoria e não dá para saber quando cada lead mudou.
 */
export async function classificarLead(id: string, c: Classificacao): Promise<Lead> {
  const supabase = getServerClient();

  if (c.stage && !LEAD_STAGES.includes(c.stage)) {
    throw new Error(`Estágio inválido: ${c.stage}`);
  }
  if (c.lossReason && !LOSS_REASONS.includes(c.lossReason)) {
    throw new Error(`Motivo inválido: ${c.lossReason}`);
  }
  if (c.interest && !LEAD_INTERESTS.includes(c.interest)) {
    throw new Error(`Procura inválida: ${c.interest}`);
  }

  const patch: Record<string, unknown> = {};
  if (c.stage !== undefined) patch.current_stage = c.stage;
  if (c.interest !== undefined) patch.interest = c.interest;

  if (c.lossReason !== undefined) patch.loss_reason = c.lossReason;
  // Regra 1: saiu de "perdido" (ou foi para outro estágio), motivo não faz mais sentido.
  if (c.stage !== undefined && c.stage !== "perdido") patch.loss_reason = null;

  if (Object.keys(patch).length === 0) {
    throw new Error("Nada para atualizar");
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(patch)
    .eq("id", id)
    .select(CAMPOS)
    .single();
  if (error) throw error;
  if (!data) throw new Error("Lead não encontrado");

  const atualizado = data as ContactRow;

  // Regra 2: histórico do funil. Só registra quando o estágio muda — trocar só a
  // procura não é evento de pipeline.
  if (c.stage !== undefined) {
    const { error: histErr } = await supabase.from("pipeline_events").insert({
      contact_id: id,
      stage: atualizado.current_stage,
      loss_reason: atualizado.loss_reason,
      changed_by: "secretaria",
    });
    // Falhar o histórico não pode desfazer a classificação que a secretária já
    // viu acontecer na tela. Registra e segue.
    if (histErr) console.error("[crm] falha ao gravar pipeline_event:", histErr.message);
  }

  return toLead(atualizado);
}
