// Constantes e rótulos do CRM, compartilhados entre servidor e navegador.
//
// Vive separado de lib/crm.ts de propósito: aquele arquivo usa a service_role key
// e não pode ser importado por Client Component. Isto aqui é só dado estático.
//
// ⚠️ Os valores espelham os enums da migration 0003. Valor novo aqui exige
// `alter type ... add value` no banco, senão a gravação falha.

export const LEAD_STAGES = [
  "novo",
  "em_atendimento",
  "agendado",
  "compareceu",
  "perdido",
] as const;

export const LOSS_REASONS = [
  "convenio",
  "sumiu_apos_preco",
  "comparou_preco",
  "prazo",
  "fora_escopo",
  "nao_e_lead",
  "outro",
] as const;

export const LEAD_INTERESTS = [
  "pac",
  "audiometria",
  "fono_infantil",
  "fono_adulto",
  "terapia_auditiva",
  "teste_orelhinha",
  "bera",
  "disfagia",
  "home_care",
  "outro",
] as const;

export const LEAD_ORIGINS = [
  "site",
  "instagram",
  "google_gbp",
  "taggo",
  "direto",
  "outro",
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];
export type LossReason = (typeof LOSS_REASONS)[number];
export type LeadInterest = (typeof LEAD_INTERESTS)[number];
export type LeadOrigin = (typeof LEAD_ORIGINS)[number];

/** Rótulo curto — é botão e coluna de quadro, não texto corrido. */
export const STAGE_LABELS: Record<LeadStage, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  agendado: "Agendado",
  compareceu: "Compareceu",
  perdido: "Perdido",
};

/**
 * Cor por estágio. Neutro para o que está em jogo, verde só para desfecho bom,
 * âmbar para o degrau que costuma travar, cinza para perdido.
 * Perdido NÃO é vermelho: perder lead é desfecho normal de operação, não erro —
 * pintar de vermelho faria a tela parecer um painel de incidente.
 */
export const STAGE_STYLES: Record<LeadStage, { dot: string; chip: string }> = {
  novo: { dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700 border-sky-200" },
  em_atendimento: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  agendado: { dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700 border-violet-200" },
  compareceu: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  perdido: { dot: "bg-neutral-400", chip: "bg-neutral-100 text-neutral-600 border-neutral-200" },
};

export const LOSS_REASON_LABELS: Record<LossReason, string> = {
  convenio: "Queria convênio",
  sumiu_apos_preco: "Sumiu após o preço",
  comparou_preco: "Foi ver preço",
  prazo: "Prazo não deu",
  fora_escopo: "Não atendemos",
  nao_e_lead: "Não é paciente",
  outro: "Outro",
};

export const LEAD_INTEREST_LABELS: Record<LeadInterest, string> = {
  pac: "PAC",
  audiometria: "Audiometria",
  fono_infantil: "Fono infantil",
  fono_adulto: "Fono adulto",
  terapia_auditiva: "Terapia auditiva",
  teste_orelhinha: "Teste da orelhinha",
  bera: "BERA",
  disfagia: "Disfagia",
  home_care: "Home care",
  outro: "Outro",
};

export const ORIGIN_LABELS: Record<LeadOrigin, string> = {
  site: "Site",
  instagram: "Instagram",
  google_gbp: "Google",
  taggo: "Taggo",
  direto: "Direto",
  outro: "Outro",
};

/** Estágios em que o lead ainda está em jogo. */
export const ESTAGIOS_ABERTOS: LeadStage[] = ["novo", "em_atendimento"];

export interface Lead {
  id: string;
  phone: string;
  name: string | null;
  origin: LeadOrigin;
  originLabel: string;
  stage: LeadStage;
  lossReason: LossReason | null;
  interest: LeadInterest | null;
  lastSeen: string;
  diasParado: number;
}

export interface CrmData {
  leads: Lead[];
  totalRetornar: number;
  totalAbertos: number;
}

/** 5511912345678 → (11) 91234-5678. Sem o 55 fica legível. */
export function formatarTelefone(phone: string): string {
  const d = phone.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

export function textoParado(dias: number): string {
  if (dias <= 0) return "hoje";
  if (dias === 1) return "1 dia";
  return `${dias} dias`;
}

/** Iniciais para o avatar. Telefone puro não rende inicial — devolve null. */
export function iniciais(nome: string | null): string | null {
  if (!nome) return null;
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return null;
  const primeira = partes[0][0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1][0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

/**
 * Dias sem resposta do lead para ele entrar na lista de retorno.
 *
 * Espelha o padrão do servidor (`getCrmLeads`). Fica aqui para a tela derivar a
 * mesma conta e não existirem duas fontes de verdade discordando na cara da
 * secretária. É chute inicial — a atendente vai dizer o que faz sentido na prática.
 */
export const PARADO_DIAS = 3;

/** O lead precisa de retorno? Mesma regra do servidor, avaliada no navegador. */
export function precisaRetorno(lead: Lead): boolean {
  return ESTAGIOS_ABERTOS.includes(lead.stage) && lead.diasParado >= PARADO_DIAS;
}
