-- 0001_init.sql — Schema inicial do CRM (RASCUNHO — Fatia 0)
-- Revisar antes de aplicar. Ver supabase/README.md para contexto e notas de LGPD.

-- Estágios do pipeline
create type lead_stage as enum (
  'novo',
  'em_atendimento',
  'agendado',
  'compareceu',
  'perdido'
);

-- Origem do lead (parseada da 1ª mensagem no whatsapp-service)
create type lead_origin as enum (
  'site',
  'instagram',
  'google_gbp',
  'taggo',
  'direto',
  'outro'
);

-- Um registro por lead
create table contacts (
  id            uuid primary key default gen_random_uuid(),
  phone         text not null unique,
  name          text,
  origin        lead_origin not null default 'outro',
  origin_detail text,                         -- ex.: página do site de onde veio
  current_stage lead_stage  not null default 'novo',
  first_seen    timestamptz not null default now(),
  last_seen     timestamptz not null default now()
);

-- Histórico de mudança de estágio (funil auditável)
create table pipeline_events (
  id         uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  stage      lead_stage not null,
  note       text,
  changed_by text,                            -- 'baileys' | 'secretaria' | user id
  changed_at timestamptz not null default now()
);

-- Mensagens — MÍNIMO. ⚠️ LGPD: guardar só o necessário para atribuição de origem.
-- Preferir persistir apenas a 1ª mensagem inbound. Reavaliar antes de ligar isto.
create table messages (
  id         uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  direction  text not null check (direction in ('in','out')),
  body       text,
  ts         timestamptz not null default now()
);

create index on contacts (current_stage);
create index on contacts (origin);
create index on pipeline_events (contact_id, changed_at desc);

-- TODO (Fatia 2): habilitar RLS + policies quando o dashboard tiver auth.
-- alter table contacts enable row level security;
-- alter table pipeline_events enable row level security;
-- alter table messages enable row level security;
