import { NextResponse } from "next/server";
import { getGscOverview } from "@/lib/gsc";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "28");

  try {
    const data = await getGscOverview(days);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
