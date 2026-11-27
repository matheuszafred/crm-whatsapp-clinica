import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ⚠️ SERVER-ONLY. Este módulo usa a service_role key e NUNCA pode ser importado
// por um Client Component. Só via rota de API (app/api/operacao/route.ts).
//
// Por que service_role e não a anon key de lib/supabase.ts: a partir da migration
// 0002 as tabelas do CRM ficam com RLS ligada e sem policy pública, então a anon
// key (que vai pro browser) não lê nada de lead. O agregado sai daqui, do servidor.

let client: SupabaseClient | null = null;

function getServerClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Nomeia exatamente o que falta — "defina as duas" não diz qual está ausente
  // no ambiente, e a resposta muda o lugar onde você vai mexer.
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

export const LEAD_ORIGINS = [
  "site",
  "instagram",
  "google_gbp",
  "taggo",
  "direto",
  "outro",
] as const;

export const LEAD_STAGES = [
  "novo",
  "em_atendimento",
  "agendado",
  "compareceu",
  "perdido",
] as const;

export type LeadOrigin = (typeof LEAD_ORIGINS)[number];
export type LeadStage = (typeof LEAD_STAGES)[number];

const ORIGIN_LABELS: Record<LeadOrigin, string> = {
  site: "Site",
  instagram: "Instagram",
  google_gbp: "Google / Maps",
  taggo: "Taggo (bio)",
  direto: "Direto",
  outro: "Outro",
};

const STAGE_LABELS: Record<LeadStage, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  agendado: "Agendado",
  compareceu: "Compareceu",
  perdido: "Perdido",
};

export interface OperacaoData {
  leadsPeriodo: number;
  leadsHoje: number;
  baseTotal: number;
  ativosPeriodo: number;
  byDay: { date: string; leads: number }[];
  byOrigin: { origin: LeadOrigin; label: string; leads: number }[];
  byStage: { stage: LeadStage; label: string; leads: number; pct: number }[];
  since: string;
}

// A clínica opera em São Paulo (UTC-3 o ano inteiro — sem horário de verão desde 2019).
// Agrupar por dia em UTC jogaria lead da noite pro dia seguinte.
const TZ = "America/Sao_Paulo";
const TZ_OFFSET = "-03:00";

/** Data (YYYY-MM-DD) de um instante, no fuso da clínica. */
function dayKey(d: Date): string {
  // en-CA formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/** Meia-noite (no fuso da clínica) do dia que contém `d`, como Date. */
function startOfDay(d: Date): Date {
  return new Date(`${dayKey(d)}T00:00:00${TZ_OFFSET}`);
}

interface ContactRow {
  origin: LeadOrigin;
  current_stage: LeadStage;
  first_seen: string;
  last_seen: string;
}

export async function getOperacaoOverview(days: number): Promise<OperacaoData> {
  const supabase = getServerClient();

  const now = new Date();
  const today = startOfDay(now);
  const since = new Date(today.getTime() - (days - 1) * 86_400_000);

  // Base total (todos os tempos) — só a contagem, sem trazer linha nenhuma.
  const { count: baseTotal, error: countErr } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true });
  if (countErr) throw countErr;

  // Leads criados no período. Volume atual é baixo (dezenas); se um dia passar
  // de ~10k linhas, trocar por agregação no Postgres (view ou RPC).
  const { data: novos, error: novosErr } = await supabase
    .from("contacts")
    .select("origin,current_stage,first_seen,last_seen")
    .gte("first_seen", since.toISOString())
    .order("first_seen", { ascending: true })
    .range(0, 9999);
  if (novosErr) throw novosErr;

  const rows = (novos ?? []) as ContactRow[];

  // Conversas ativas: qualquer contato (novo ou antigo) que mandou mensagem no período.
  const { count: ativosPeriodo, error: ativosErr } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .gte("last_seen", since.toISOString());
  if (ativosErr) throw ativosErr;

  // --- Série por dia: pré-preenche todos os dias do período para não ter buraco no gráfico.
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    buckets.set(dayKey(new Date(since.getTime() + i * 86_400_000)), 0);
  }
  for (const r of rows) {
    const k = dayKey(new Date(r.first_seen));
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  const byDay = [...buckets.entries()].map(([date, leads]) => ({ date, leads }));

  // --- Por origem: só origens que apareceram, da maior pra menor.
  const originCounts = new Map<LeadOrigin, number>();
  for (const r of rows) {
    originCounts.set(r.origin, (originCounts.get(r.origin) ?? 0) + 1);
  }
  const byOrigin = LEAD_ORIGINS.filter((o) => originCounts.has(o))
    .map((origin) => ({
      origin,
      label: ORIGIN_LABELS[origin],
      leads: originCounts.get(origin) ?? 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  // --- Funil: coorte do período, na ordem do pipeline (inclui estágios zerados,
  // porque um degrau vazio é informação — mostra onde a operação trava).
  const stageCounts = new Map<LeadStage, number>();
  for (const r of rows) {
    stageCounts.set(r.current_stage, (stageCounts.get(r.current_stage) ?? 0) + 1);
  }
  const totalCoorte = rows.length;
  const byStage = LEAD_STAGES.map((stage) => {
    const leads = stageCounts.get(stage) ?? 0;
    return {
      stage,
      label: STAGE_LABELS[stage],
      leads,
      pct: totalCoorte ? Math.round((leads / totalCoorte) * 1000) / 10 : 0,
    };
  });

  const todayKey = dayKey(now);

  return {
    leadsPeriodo: rows.length,
    leadsHoje: rows.filter((r) => dayKey(new Date(r.first_seen)) === todayKey).length,
    baseTotal: baseTotal ?? 0,
    ativosPeriodo: ativosPeriodo ?? 0,
    byDay,
    byOrigin,
    byStage,
    since: since.toISOString(),
  };
}
