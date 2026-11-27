import { NextResponse } from "next/server";
import { classificarLead, getCrmLeads } from "@/lib/crm";

// ⚠️ Esta rota devolve NOME e TELEFONE de paciente — diferente de /api/operacao,
// que só devolve agregado. Enquanto o dashboard for público ela fica exposta.
// Controle de acesso: senha compartilhada em proxy.ts (piloto).

// Muda a cada mensagem que chega e a cada classificação — nada de cache.
export const dynamic = "force-dynamic";

const FILTROS = ["retornar", "abertos", "todos"] as const;
type Filtro = (typeof FILTROS)[number];

/**
 * Erro do supabase-js é objeto simples ({ message, code, hint }), NÃO instância de
 * Error — então `e instanceof Error` engole a causa real e devolve texto genérico.
 * Já custou um 500 opaco aqui; a mensagem do banco é o que diz onde mexer.
 */
function mensagemDeErro(e: unknown, padrao: string): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const { message, hint } = e as { message?: unknown; hint?: unknown };
    if (typeof message === "string") {
      return typeof hint === "string" && hint ? `${message} (${hint})` : message;
    }
  }
  return padrao;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const bruto = searchParams.get("filtro") ?? "retornar";
  const filtro = (FILTROS as readonly string[]).includes(bruto)
    ? (bruto as Filtro)
    : "retornar";

  // Quantos dias sem resposta do lead para ele entrar na lista de retorno.
  // 3 é chute inicial — a atendente vai dizer o que faz sentido na prática dela.
  const paradoHa = Number(searchParams.get("paradoHa") ?? 3);

  try {
    const data = await getCrmLeads(filtro, Number.isFinite(paradoHa) ? paradoHa : 3);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: mensagemDeErro(e, "Erro ao carregar leads") },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, stage, lossReason, interest } = body ?? {};

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id do lead é obrigatório" }, { status: 400 });
    }

    const lead = await classificarLead(id, { stage, lossReason, interest });
    return NextResponse.json({ lead });
  } catch (e) {
    const msg = mensagemDeErro(e, "Erro ao classificar");
    // Motivo/estágio inválido é erro de quem chamou, não do servidor.
    const status = /inválid|obrigatório|Nada para atualizar/i.test(msg) ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
