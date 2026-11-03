import { useState } from "react";
import { queryOptions } from "@tanstack/react-query";
import { ExternalLink, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BADGES, PARTNER_INTERESTS, proposalSchema } from "@/lib/partners";
import { submitPartnerProposal, trackPartnerClick } from "@/lib/partners.functions";

export type Partner = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  relation: string | null;
  country: string;
  city: string | null;
  category: string;
  areas: string[];
  partnership_types: string[];
  description: string;
  website: string | null;
  logo_url: string | null;
};

export const partnersQuery = queryOptions({
  queryKey: ["partners"],
  staleTime: 300_000,
  queryFn: async () => {
    const { data } = await supabase
      .from("partners")
      .select("id, slug, name, kind, relation, country, city, category, areas, partnership_types, description, website, logo_url")
      .eq("published", true)
      .order("position");
    return (data ?? []) as Partner[];
  },
});

export function PartnerCard({ p, origin, onPropose }: { p: Partner; origin: string; onPropose: (p: Partner) => void }) {
  const { user } = useAuth();
  return (
    <article className="flex h-full flex-col border-t pt-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-card">
          {p.logo_url ? <img src={p.logo_url} alt={`Logo ${p.name}`} loading="lazy" className="h-full w-full object-contain p-1" /> : <span className="font-display text-xl font-bold">{p.name[0]}</span>}
        </div>
        <div className="min-w-0">
          <span className="eyebrow">{BADGES[p.kind as "founder" | "external"] ?? BADGES.external}</span>
          <h3 className="text-xl font-bold leading-tight">{p.name}</h3>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{[p.city, p.country].filter(Boolean).join(", ")}</p>
      <p className="mt-1 text-sm font-medium">{p.category}</p>
      {p.relation && <p className="mt-1 text-xs text-muted-foreground">{p.relation}</p>}
      <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">{p.description}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {p.website && (
          <Button asChild variant="outline" size="sm">
            <a href={p.website} target="_blank" rel="noopener noreferrer" onClick={() => void trackPartnerClick({ data: { partnerId: p.id, member: !!user } }).catch(() => {})}>
              Conhecer<ExternalLink className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        <Button size="sm" onClick={() => onPropose(p)} data-origin={origin}>Propor parceria</Button>
      </div>
    </article>
  );
}

const empty = { name: "", email: "", company: "", country: "", area: "", interest: "", proposal: "", link: "", website: "" };

export function ProposalDialog({ open, onOpenChange, partner, origin }: { open: boolean; onOpenChange: (o: boolean) => void; partner: Partner | null; origin: string }) {
  const [f, setF] = useState(empty);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const parsed = proposalSchema.safeParse({ ...f, consent, partnerId: partner?.id, origin, interest: f.interest || undefined });
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? "Verifique os campos.");
    setBusy(true);
    try {
      const r = await submitPartnerProposal({ data: parsed.data });
      if (!r.ok) return setErr(r.error);
      setDone(true);
      setF(empty);
      setConsent(false);
    } catch {
      toast.error("Não foi possível enviar agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-sm border bg-background px-3 py-2 text-sm";
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setDone(false); setErr(null); } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Propor parceria{partner ? ` · ${partner.name}` : ""}</DialogTitle>
          <DialogDescription>A equipe do Outro Ângulo lê cada proposta e responde por e-mail quando houver encaixe.</DialogDescription>
        </DialogHeader>
        {done ? (
          <p className="py-6 text-center">Proposta enviada. Obrigado — vamos analisar e entrar em contato pelo e-mail informado.</p>
        ) : (
          <form onSubmit={submit} className="grid gap-3">
            <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden value={f.website} onChange={set("website")} name="website" />
            <label className="grid gap-1 text-sm">Nome*<input className={input} value={f.name} onChange={set("name")} maxLength={100} required /></label>
            <label className="grid gap-1 text-sm">E-mail*<input type="email" className={input} value={f.email} onChange={set("email")} maxLength={255} required /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">Empresa<input className={input} value={f.company} onChange={set("company")} maxLength={120} /></label>
              <label className="grid gap-1 text-sm">País<input className={input} value={f.country} onChange={set("country")} maxLength={60} /></label>
            </div>
            <label className="grid gap-1 text-sm">Área de atuação<input className={input} value={f.area} onChange={set("area")} maxLength={100} /></label>
            <label className="grid gap-1 text-sm">Tipo de interesse*
              <select className={input} value={f.interest} onChange={set("interest")} required>
                <option value="">Escolha…</option>
                {PARTNER_INTERESTS.map((i) => <option key={i}>{i}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">Descrição da proposta*<textarea className={`${input} min-h-28`} value={f.proposal} onChange={set("proposal")} maxLength={2000} required /></label>
            <label className="grid gap-1 text-sm">Website ou LinkedIn<input className={input} value={f.link} onChange={set("link")} placeholder="https://" maxLength={300} /></label>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              Autorizo o Outro Ângulo a usar estes dados para responder à proposta, conforme a Política de Privacidade.
            </label>
            {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
            <Button type="submit" disabled={busy}>{busy ? "Enviando…" : "Enviar proposta"}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Grid of partners with the proposal dialog wired in. */
export function PartnerGrid({ partners, origin }: { partners: Partner[]; origin: string }) {
  const [target, setTarget] = useState<Partner | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="grid gap-10 md:grid-cols-3">
        {partners.map((p) => <PartnerCard key={p.id} p={p} origin={origin} onPropose={(x) => { setTarget(x); setOpen(true); }} />)}
      </div>
      <ProposalDialog open={open} onOpenChange={setOpen} partner={target} origin={origin} />
    </>
  );
}

export function GeneralProposalButton({ origin, label = "Propor parceria" }: { origin: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>{label}</Button>
      <ProposalDialog open={open} onOpenChange={setOpen} partner={null} origin={origin} />
    </>
  );
}
