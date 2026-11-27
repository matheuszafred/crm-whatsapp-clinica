# supabase — Camada de dados do CRM

Banco que dá **estado** ao dashboard (que hoje é só leitura de GA4/GSC). Recebe os leads
capturados pelo `whatsapp-service/` e alimenta as telas de operação/pipeline.

## Status

📋 **Planejado (Fatia 0 do CRM).** `migrations/0001_init.sql` é o schema-rascunho inicial —
revisar antes de aplicar.

## Modelo (resumo)

- **contacts** — um registro por lead (telefone único), com origem, estágio atual,
  **motivo da perda** e **o que a pessoa procura**.
- **pipeline_events** — histórico de mudança de estágio + motivo (auditoria do funil).
- **messages** — *opcional/mínimo*. Guarda só o necessário para atribuição de origem.
  ⚠️ **LGPD:** conteúdo de conversa é dado sensível de paciente — guardar o mínimo,
  com acesso restrito. Preferir não persistir corpo de mensagem além da 1ª.

## Estágios do pipeline

`novo → em_atendimento → agendado → compareceu → perdido`

## Origens

`site · instagram · google_gbp · taggo · direto · outro`
(A origem vem do texto da 1ª mensagem do lead — ver `whatsapp-service/`.)

## Motivo da perda

`convenio · sumiu_apos_preco · comparou_preco · prazo · fora_escopo · nao_e_lead · outro`

Só faz sentido com `current_stage = 'perdido'`; **a aplicação limpa ao sair desse estágio**
(não há CHECK no banco, de propósito — ver `0003`). As categorias não foram inventadas:
saíram da auditoria de 60 conversas feita pelo atendimento em 14/08/2026.

## O que a pessoa procura

`pac · audiometria · fono_infantil · fono_adulto · terapia_auditiva · teste_orelhinha ·
bera · disfagia · home_care · outro`

Preenchido **pela secretária na tela do CRM** — o `whatsapp-service` não deduz isso.
Serviço novo entra com `alter type lead_interest add value '<novo>';`.

## ⚠️ LGPD / acesso

Ao introduzir dados de leads, o dashboard **deixa de poder ser público**. Fatia 2 inclui
auth (Supabase Auth) e política de dados mínimos.
