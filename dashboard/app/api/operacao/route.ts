import { NextResponse } from "next/server";
import { getOperacaoOverview } from "@/lib/operacao";

// Dados de lead mudam a cada mensagem que chega — nada de cache.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "28");

  try {
    const data = await getOperacaoOverview(days);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
