-- 0002_rls_lock.sql — Fecha as tabelas do CRM para a anon key (Fatia 2)
--
-- POR QUÊ: o dashboard é público hoje e a NEXT_PUBLIC_SUPABASE_ANON_KEY vai pro
-- browser. Sem RLS, qualquer pessoa com essa chave lê a tabela contacts inteira,
-- telefone incluso. Isto liga RLS SEM criar policy nenhuma → deny-all para anon
-- e authenticated.
--
-- O que NÃO quebra:
--   · whatsapp-service (escreve com service_role → bypassa RLS por definição)
--   · dashboard /operacao (lê pela rota /api/operacao, também com service_role)
--
-- Quando a Fatia 2 ganhar auth, criar aqui as policies de leitura
-- para o papel autenticado da clínica.

alter table contacts        enable row level security;
alter table pipeline_events enable row level security;
alter table messages        enable row level security;
