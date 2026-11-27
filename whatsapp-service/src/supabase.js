import { createClient } from "@supabase/supabase-js";
import { parseOrigin } from "./origin.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env");
}

// service_role: roda só no servidor, ignora RLS. NUNCA vai pro front.
const supabase = createClient(url, key, { auth: { persistSession: false } });

/**
 * Registra um lead. Se o telefone já existe → apenas atualiza last_seen (recorrente).
 * Se é novo → cria contact + 1º pipeline_event ('novo'). NÃO grava conteúdo de mensagem.
 */
export async function upsertLead({ phone, name, firstMessage, ts }) {
  const seenAt = new Date(ts).toISOString();

  const { data: existing, error: selErr } = await supabase
    .from("contacts")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    await supabase.from("contacts").update({ last_seen: seenAt }).eq("id", existing.id);
    return { status: "recurring", id: existing.id };
  }

  const { origin, origin_detail } = parseOrigin(firstMessage);

  const { data: inserted, error: insErr } = await supabase
    .from("contacts")
    .insert({
      phone,
      name,
      origin,
      origin_detail,
      current_stage: "novo",
      first_seen: seenAt,
      last_seen: seenAt,
    })
    .select("id")
    .single();
  if (insErr) throw insErr;

  await supabase.from("pipeline_events").insert({
    contact_id: inserted.id,
    stage: "novo",
    changed_by: "baileys",
    note: `origem: ${origin}`,
  });

  console.log(`[lead] novo → ${phone} | origem=${origin}`);
  return { status: "new", id: inserted.id };
}
