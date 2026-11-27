"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Lead, LeadInterest, LeadStage, LossReason } from "@/lib/crm-labels";

// Estado do CRM compartilhado pelas duas abas (Conversas e Pipeline).
//
// POR QUE UM CONTEXTO E NÃO UM FETCH POR PÁGINA: as duas abas mostram a mesma
// base sob recortes diferentes. Buscando uma vez, trocar de aba é instantâneo e
// uma classificação feita numa aba já aparece na outra — se cada página tivesse
// seu próprio estado, a atendente veria o quadro discordar da lista.
//
// Buscamos `filtro=todos` e recortamos no navegador. São ~140 registros; separar
// no servidor aqui só criaria ida e volta sem ganho. Se um dia passar de alguns
// milhares, voltar a filtrar no servidor.

interface Classificacao {
  stage?: LeadStage;
  lossReason?: LossReason | null;
  interest?: LeadInterest | null;
}

interface CrmContexto {
  leads: Lead[];
  carregando: boolean;
  erro: string | null;
  salvandoId: string | null;
  recarregar: () => void;
  classificar: (lead: Lead, patch: Classificacao) => Promise<void>;
}

const Ctx = createContext<CrmContexto | null>(null);

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  // `vivo` evita corrida: uma recarga lenta não pode sobrescrever uma mais nova.
  const buscar = useCallback(async (vivo: () => boolean = () => true) => {
    setCarregando(true);
    setErro(null);
    try {
      const r = await fetch("/api/crm?filtro=todos");
      const d = await r.json();
      if (!vivo()) return;
      if (d.error) throw new Error(d.error);
      setLeads(d.leads ?? []);
    } catch (e) {
      if (vivo()) setErro(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      if (vivo()) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    void buscar(() => ativo);
    return () => {
      ativo = false;
    };
  }, [buscar]);

  /**
   * Classificação otimista: a tela muda na hora e volta atrás se o servidor
   * recusar. Deixar a secretária achar que salvou quando não salvou é pior que
   * a espera de meio segundo.
   */
  const classificar = useCallback(async (lead: Lead, patch: Classificacao) => {
    const anteriores = leads;

    const otimista: Lead = { ...lead, ...patch };
    // Mesma regra do servidor: fora de "perdido", motivo não faz sentido.
    if (patch.stage !== undefined && patch.stage !== "perdido") otimista.lossReason = null;

    setLeads((atual) => atual.map((l) => (l.id === lead.id ? otimista : l)));
    setSalvandoId(lead.id);
    setErro(null);

    try {
      const r = await fetch("/api/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, ...patch }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Não foi possível salvar");
      setLeads((atual) => atual.map((l) => (l.id === lead.id ? j.lead : l)));
    } catch (e) {
      setLeads(anteriores);
      setErro(e instanceof Error ? e.message : "Não foi possível salvar");
    } finally {
      setSalvandoId(null);
    }
  }, [leads]);

  const valor = useMemo<CrmContexto>(
    () => ({ leads, carregando, erro, salvandoId, recarregar: () => void buscar(), classificar }),
    [leads, carregando, erro, salvandoId, buscar, classificar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCrm(): CrmContexto {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCrm precisa estar dentro de <CrmProvider>");
  return ctx;
}

/**
 * Versão que não explode fora do provider.
 *
 * A sidebar é do sistema inteiro, mas o CrmProvider só envolve /crm — as telas de
 * métrica não podem buscar /api/crm, que exige senha e devolveria 401. Então o
 * contador de "a retornar" no menu simplesmente não aparece fora do CRM, em vez
 * de derrubar a página.
 */
export function useCrmOpcional(): CrmContexto | null {
  return useContext(Ctx);
}
