// Deriva a ORIGEM do lead a partir da 1ª mensagem.
// Os links wa.me devem carregar uma tag "(ref: X)" — ver task "Repontar wa.me".
// Ex.: "Olá! Quero agendar uma avaliação. (ref: site pag: home)"

const REF_MAP = {
  site: "site",
  instagram: "instagram",
  ig: "instagram",
  google: "google_gbp",
  gbp: "google_gbp",
  maps: "google_gbp",
  taggo: "taggo",
  bio: "taggo",
  direto: "direto",
};

export function parseOrigin(text = "") {
  const t = (text || "").toLowerCase();

  // 1) tag explícita "(ref: X)" — preferencial, definida por nós no wa.me
  const ref = t.match(/ref:\s*([a-z_]+)/);
  if (ref && REF_MAP[ref[1]]) {
    return { origin: REF_MAP[ref[1]], origin_detail: extractDetail(text) };
  }

  // 2) fallback por palavra-chave no texto
  for (const [k, v] of Object.entries(REF_MAP)) {
    if (t.includes(k)) return { origin: v, origin_detail: null };
  }

  // 3) sem pista → veio direto / desconhecido
  return { origin: "direto", origin_detail: null };
}

function extractDetail(text) {
  const m = (text || "").match(/pag:\s*([^)]+)/i);
  return m ? m[1].trim() : null;
}
