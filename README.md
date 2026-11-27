# CRM de WhatsApp para clínica

Sistema de captura e atendimento de leads para uma clínica de saúde que atende pelo
WhatsApp. Feito pela Daedalus para um cliente real; os dados
de identificação foram removidos desta versão.

**O problema:** a clínica recebia os contatos pelo WhatsApp da secretária e não sabia de qual
canal cada um vinha (site, Instagram, Google), quantos viravam agendamento nem por que os outros
se perdiam.

**A solução:** um serviço espelha o WhatsApp da clínica sem mudar o atendimento: a secretária
continua respondendo pelo celular. Cada contato novo vira lead com a origem identificada. Um
painel mostra tráfego, SEO e funil, e um CRM simples deixa a secretária classificar cada lead.

## Estrutura

```
├── dashboard/          Next.js 16 + Tailwind + shadcn/ui + Recharts (Vercel)
│                       /        GA4 (tráfego)
│                       /seo     Search Console
│                       /operacao  leads por dia, origem e funil (só agregados)
│                       /crm     lista e pipeline de leads (protegido por senha)
├── whatsapp-service/   Node 22 + Baileys em Docker: escuta o WhatsApp e grava leads no Supabase
├── supabase/           Schema e migrations (contacts, pipeline_events, messages) com RLS deny-all
├── docs/               Arquitetura, decisões e gotchas de operação
└── scripts/            Autorização OAuth do Search Console / Business Profile e acesso GA4
```

## Como funciona

1. Cada CTA (site, Instagram, Google Business, link da bio) abre um `wa.me` com mensagem
   pré-preenchida que carrega a origem: `Olá! Quero agendar uma avaliação. (ref: site pag: home)`.
2. O `whatsapp-service`, pareado como aparelho conectado, recebe a mesma mensagem que a
   secretária, resolve o telefone real (o WhatsApp endereça por LID) e extrai a origem.
3. O lead entra no Supabase. O dashboard lê pelo servidor com `service_role`, e a tela
   `/operacao` só recebe contagens: nenhum nome ou telefone vai para o navegador.
4. No `/crm`, a secretária move o lead no pipeline e registra o motivo de perda (convênio,
   preço, prazo, fora do escopo…). As categorias saíram de uma auditoria manual das conversas.

Detalhes, diagrama e o porquê de cada decisão em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## Decisões que valem destacar

- **Baileys em vez da WhatsApp Cloud API:** preserva o atendimento humano pelo celular. O custo
  aceito é o risco de banimento, isolado num chip dedicado.
- **Agregação no servidor:** o browser nunca toca em dado de paciente (LGPD).
- **RLS deny-all:** a chave pública do Supabase não lê nada; só o servidor acessa.
- **Motivos de perda como enum, não texto livre:** enum dá para contar.

## Rodando localmente

```bash
# banco: aplique supabase/migrations/*.sql no seu projeto Supabase

cd dashboard && cp .env.example .env.local   # preencha as chaves
npm install && npm run dev

cd ../whatsapp-service && cp .env.example .env
docker compose up -d && docker logs -f clinica-whatsapp   # parear por QR ou código
```

As variáveis de cada parte estão nos `.env.example` e em
[`whatsapp-service/README.md`](whatsapp-service/README.md).
