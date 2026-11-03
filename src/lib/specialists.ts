export const SPECIALIST_CATEGORIES: Record<string, string> = {
  ia: "Inteligência Artificial e Automação",
  dev: "Desenvolvimento de Sistemas e Aplicativos",
  marketing: "Marketing Digital e Vendas",
  financas: "Contabilidade e Finanças",
  juridico: "Advocacia e Consultoria Jurídica",
  gestao: "Gestão e Consultoria Empresarial",
  design: "Design e Branding",
};

/** Regulated professions: credentials matter and (for law) no public pricing. */
export const REGULATED = new Set(["juridico", "financas"]);

export const PROJECT_STAGES: Record<string, string> = {
  ideia: "Ideia",
  validacao: "Validação",
  mvp: "MVP",
  operacao: "Em operação",
  expansao: "Expansão",
};

export const PARTNERSHIP_TYPES: Record<string, string> = {
  socio_tecnico: "Sócio técnico",
  socio_comercial: "Sócio comercial",
  socio_operacional: "Sócio operacional",
  expansao: "Parceiro para expansão",
  outro: "Outro tipo",
};

export type ProStatus = "draft" | "pending" | "approved" | "suspended";

export const STATUS_LABEL: Record<ProStatus, string> = {
  draft: "Rascunho",
  pending: "Em análise",
  approved: "Profissional cadastrado",
  suspended: "Suspenso",
};

/** Public budget is hidden for law (OAB rules on advertising). */
export function canShowBudget(categories: string[]) {
  return !categories.includes("juridico");
}

/** Badge shown publicly: only an admin-set verification earns the seal. */
export function badgeFor(p: { status: string; verified_at: string | null }) {
  if (p.status !== "approved") return null;
  return p.verified_at ? "verified" : "registered";
}

export function matchesSpecialist(
  p: { categories: string[]; city: string | null; remote: boolean; verified_at: string | null; headline: string; specialties: string[]; display_name?: string },
  f: { category: string; place: string; verifiedOnly: boolean; q: string },
) {
  if (f.verifiedOnly && !p.verified_at) return false;
  if (f.category !== "todas" && !p.categories.includes(f.category)) return false;
  if (f.place.trim().toLowerCase() === "remoto") { if (!p.remote) return false; }
  else if (f.place.trim() && !(p.city ?? "").toLowerCase().includes(f.place.trim().toLowerCase())) return false;
  const q = f.q.trim().toLowerCase();
  if (q && ![p.headline, p.display_name ?? "", ...p.specialties].some((s) => s.toLowerCase().includes(q))) return false;
  return true;
}

/** A profile is ready to be sent for review. Returns missing field labels. */
export function missingForReview(p: { headline: string; about: string; categories: string[]; consent_public: boolean }) {
  const m: string[] = [];
  if (p.headline.trim().length < 5) m.push("título profissional");
  if (p.about.trim().length < 40) m.push("descrição (mín. 40 caracteres)");
  if (!p.categories.length) m.push("ao menos uma categoria");
  if (!p.consent_public) m.push("autorização para exibir o perfil");
  return m;
}

/** Only accepted interests open a conversation. */
export function canTalk(status: string) {
  return status === "accepted";
}

export function splitList(s: string) {
  return s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12);
}
