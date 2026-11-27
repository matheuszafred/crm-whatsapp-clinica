import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase (anon / público) para leitura no dashboard.
// A service_role key NUNCA entra aqui — fica só no whatsapp-service (server).
let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env ausente: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  client = createClient(url, anonKey);
  return client;
}
