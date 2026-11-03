export const OPP_CATEGORIES: Record<string, string> = {
  socio: "Procurando sócio",
  parceiro: "Buscando parceiro comercial",
  servicos: "Oferecendo serviços",
  profissional: "Procurando profissional",
  projetos: "Projetos e colaborações",
  networking: "Networking",
};

export const RESOURCE_KINDS: Record<string, string> = {
  template: "Template",
  planilha: "Planilha",
  checklist: "Checklist",
  prompt: "Prompt de IA",
  guia: "Guia prático",
  material: "Material complementar",
};

export const VISIBILITY_LABEL: Record<string, string> = {
  public: "Pública",
  private: "Privada",
  exclusive: "Exclusiva",
};

/** Opportunity matches the board filters. */
export function matchesOpportunity(
  o: { category: string; city: string | null; remote: boolean; status: string },
  f: { category: string; place: string; openOnly: boolean },
) {
  if (f.openOnly && o.status !== "open") return false;
  if (f.category !== "todas" && o.category !== f.category) return false;
  if (f.place === "remoto") return o.remote;
  if (f.place.trim()) return (o.city ?? "").toLowerCase().includes(f.place.trim().toLowerCase());
  return true;
}
