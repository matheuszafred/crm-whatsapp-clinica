import { NextResponse, type NextRequest } from "next/server";

// Trava de acesso do CRM (arquivo `proxy.ts` — o antigo `middleware.ts` foi
// descontinuado no Next 16).
//
// POR QUÊ: /operacao e as demais telas devolvem só agregado — nenhum dado de
// pessoa — e por isso o painel pode ser público. /crm é a primeira exceção: ela
// mostra NOME e TELEFONE de paciente, porque a secretária precisa saber para quem
// ligar. Sem trava, publicar essa rota é publicar dado de saúde na internet aberta.
//
// ESCOPO DO QUE ISTO É: senha compartilhada, para destravar o uso da secretária
// agora. Ela responde "entrou quem sabe a senha", NÃO responde "quem viu o quê" —
// não há identidade nem trilha de auditoria por pessoa. Login de verdade continua
// pendente, e a LGPD vai pedir ele quando o uso deixar de ser piloto.
//
// FALHA FECHADA: sem a variável CRM_SENHA configurada, a rota RECUSA. Um deploy
// esquecido devolve 503, não a lista de pacientes.

const PROTEGIDAS = ["/crm", "/api/crm"];

function pedirSenha() {
  // ⚠️ Valor de cabecalho HTTP tem que ser ASCII puro (ByteString). Um travessao
  // no realm faz `new NextResponse` lancar TypeError, o Next devolve 500, e o
  // navegador NUNCA mostra o prompt de senha — a tela fica inacessivel de um jeito
  // que nao parece problema de acesso. Nada de acento ou travessao aqui.
  return new NextResponse("Acesso restrito ao atendimento.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Atendimento", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTEGIDAS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // .trim() porque valor colado no painel da Vercel costuma vir com espaco ou
  // quebra de linha invisivel no fim. Sem isto a senha CERTA seria recusada, e o
  // sintoma (401 com a senha correta) nao aponta para a causa.
  const senha = process.env.CRM_SENHA?.trim();

  if (!senha) {
    // Nunca serve a rota sem trava configurada — nem em preview, nem em produção.
    return new NextResponse(
      "CRM indisponível: a variável CRM_SENHA não está configurada neste ambiente.",
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const header = request.headers.get("authorization");

  if (header?.startsWith("Basic ")) {
    // atob existe no runtime de edge; Buffer não.
    // O usuario e ignorado de proposito: a secretaria pode digitar o que quiser ali.
    const [, enviada] = atob(header.slice(6)).split(":");
    if (enviada?.trim() === senha) {
      const res = NextResponse.next();
      // Dado de paciente não fica em cache de intermediário nenhum.
      res.headers.set("Cache-Control", "no-store, private");
      return res;
    }
  }

  return pedirSenha();
}

export const config = {
  matcher: ["/crm/:path*", "/api/crm/:path*"],
};
