-- 0003_motivo_perda_e_procura.sql — Dá lugar no banco para o que o relatório descobriu (F3)
--
-- POR QUÊ: a atendente auditou as conversas na mão e
-- classificou por que não avançaram. Esse diagnóstico só existiu porque ela leu
-- conversa por conversa. O banco não tem onde guardar nem o motivo da
-- perda nem o que a pessoa procurava, então hoje isso cairia em texto livre e voltaria
-- a ser incontável, que é justamente o problema que a tela da secretária resolve.
--
-- Os valores abaixo NÃO foram inventados: são as categorias que ela mesma encontrou.
-- Virar enum (e não texto) é o ponto todo — enum conta, texto livre não.
--
-- O que NÃO muda:
--   · whatsapp-service — segue escrevendo só contacts + pipeline_events, colunas novas
--     nascem nulas e ele não precisa saber que existem
--   · /operacao — as queries atuais não referenciam estas colunas
--   · RLS — colunas herdam a trava de tabela do 0002; nada a refazer

-- ---------------------------------------------------------------------------
-- Motivo da perda — só faz sentido quando current_stage = 'perdido'
-- ---------------------------------------------------------------------------
-- Sem CHECK amarrando ao estágio de propósito: se ela mover um lead de 'perdido'
-- de volta para 'em_atendimento', um CHECK faria o UPDATE falhar na cara dela.
-- Quem limpa o motivo ao sair de 'perdido' é a aplicação.
create type lead_loss_reason as enum (
  'convenio',          -- clínica é particular; motivo mais frequente na auditoria
  'sumiu_apos_preco',  -- silêncio depois da tabela de preços. Ela descreve como
                       -- "o padrão mais comum de todos", inclusive sem menção a convênio
  'comparou_preco',    -- foi cotar em outro lugar
  'prazo',             -- laudo urgente (concurso/admissional) vs. os até 5 dias da clínica
  'fora_escopo',       -- home care, disfagia, BERA — a clínica não atende
  'nao_e_lead',        -- staff, doutora, conhecido. Hoje número interno
                       -- entra como lead e a limpeza é retroativa
  'outro'
);

-- ---------------------------------------------------------------------------
-- O que a pessoa procura
-- ---------------------------------------------------------------------------
-- Metade da procura auditada é EXAME (11 de 21 classificadas), não terapia — e exame
-- é o produto mais fácil de cotar em três clínicas. Sem este campo não dá para provar
-- isso de forma contínua, nem cruzar procura com canal de origem.
-- Serviço novo entra com: alter type lead_interest add value '<novo>';
create type lead_interest as enum (
  'pac',               -- Processamento Auditivo Central. 5 casos, maioria criança
  'audiometria',       -- 5 casos, inclui concurso público e admissional
  'fono_infantil',     -- 3 casos, troca de fonemas / indicação da escola
  'fono_adulto',       -- 3 casos
  'terapia_auditiva',  -- terapia / cabine acústica
  'teste_orelhinha',
  'bera',              -- não realizado na clínica, encaminhado a hospital parceiro
  'disfagia',          -- fora da especialidade da profissional
  'home_care',         -- fora do escopo atual
  'outro'
);

alter table contacts
  add column loss_reason lead_loss_reason,
  add column interest    lead_interest;

-- Histórico também guarda o motivo: se ela corrigir a classificação depois, o funil
-- continua auditável em pipeline_events (mesma lógica do stage, que já vive nos dois).
alter table pipeline_events
  add column loss_reason lead_loss_reason;

comment on column contacts.loss_reason is
  'Preenchido apenas quando current_stage = ''perdido''. A aplicação limpa ao sair desse estágio.';
comment on column contacts.interest is
  'O que o lead procurou. Alimentado pela secretária na tela do CRM — o whatsapp-service não deduz isso.';

-- ---------------------------------------------------------------------------
-- Índices para as duas telas do CRM
-- ---------------------------------------------------------------------------
-- Relatório automático: "quantos perdemos por convênio neste mês"
create index on contacts (loss_reason) where loss_reason is not null;
create index on contacts (interest)    where interest    is not null;

-- Lista de retorno do dia: leads que ainda não terminaram o funil, do mais parado
-- para o mais recente. NOTA: last_seen só avança quando o LEAD escreve — resposta da
-- secretária não passa pelo Baileys. Para "precisa de retorno" esse é o sinal certo:
-- mede há quanto tempo a pessoa sumiu.
create index on contacts (last_seen desc)
  where current_stage in ('novo', 'em_atendimento');
