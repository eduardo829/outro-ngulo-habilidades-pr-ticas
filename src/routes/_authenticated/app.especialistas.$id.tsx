import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, ExternalLink, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, Page, Tag } from "@/components/community/Bits";
import { fetchProfiles, openConversation } from "@/lib/community";
import { SPECIALIST_CATEGORIES, badgeFor, canShowBudget } from "@/lib/specialists";
import { RequestForm } from "@/components/specialists/RequestForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/app/especialistas/$id")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Especialista — Outro Ângulo" }, { name: "description", content: "Perfil profissional na comunidade Outro Ângulo." }, { property: "og:title", content: "Especialista — Outro Ângulo" }, { property: "og:description", content: "Perfil profissional na comunidade Outro Ângulo." }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Profile,
});

type Link_ = { title?: string; url?: string };
type Cred = { type?: string; number?: string; issuer?: string };

function Profile() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const q = useQuery({
    queryKey: ["specialist", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("professional_profiles").select("*").eq("user_id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const people = await fetchProfiles([id]);
      return { ...data, person: people.get(id) };
    },
  });
  if (q.isLoading) return <Page><p className="text-muted-foreground">Carregando…</p></Page>;
  const p = q.data;
  if (!p) return <Page><p>Perfil não encontrado ou ainda não aprovado.</p><Link to="/app/especialistas" className="underline">Voltar aos especialistas</Link></Page>;
  const name = p.person?.display_name ?? "Profissional";
  const badge = badgeFor(p);
  const portfolio = (Array.isArray(p.portfolio) ? p.portfolio : []) as Link_[];
  const creds = (Array.isArray(p.credentials) ? p.credentials : []) as Cred[];
  async function talk() {
    try { const c = await openConversation(id); navigate({ to: "/mensagens/$id", params: { id: c } }); } catch { toast.error("Não foi possível abrir a conversa."); }
  }
  return (
    <Page narrow>
      <Link to="/app/especialistas" className="text-sm text-muted-foreground hover:underline">← Especialistas</Link>
      {p.status !== "approved" && <p className="mt-4 rounded-md bg-secondary p-3 text-sm">Pré-visualização: este perfil ainda não está público.</p>}
      <div className="mt-6 flex items-start gap-4">
        <Avatar name={name} url={p.person?.avatar_url} size="lg" />
        <div>
          <h1 className="text-2xl font-extrabold">{name}</h1>
          <p className="text-muted-foreground">{p.headline}</p>
          <p className="mt-2 text-sm">{badge === "verified" ? <span className="inline-flex items-center gap-1 font-medium text-primary"><BadgeCheck className="h-4 w-4" />Verificado pelo Outro Ângulo{p.verified_at ? ` em ${new Date(p.verified_at).toLocaleDateString("pt-BR")}` : ""}</span> : badge === "registered" ? <span className="text-muted-foreground">Profissional cadastrado</span> : null}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {p.categories.map((c) => <Tag key={c} tone="primary">{SPECIALIST_CATEGORIES[c] ?? c}</Tag>)}
        {p.specialties.map((s) => <Tag key={s}>{s}</Tag>)}
      </div>
      {p.about && <section className="mt-8"><h2 className="eyebrow">Sobre</h2><p className="mt-2 whitespace-pre-line">{p.about}</p></section>}
      {p.experience && <section className="mt-6"><h2 className="eyebrow">Experiência</h2><p className="mt-2 whitespace-pre-line">{p.experience}</p></section>}
      {!!portfolio.length && <section className="mt-6"><h2 className="eyebrow">Portfólio</h2><ul className="mt-2 space-y-1">{portfolio.filter((l) => l.url?.startsWith("https://")).map((l, i) => <li key={i}><a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 underline">{l.title || l.url}<ExternalLink className="h-3 w-3" /></a></li>)}</ul></section>}
      {!!creds.length && <section className="mt-6"><h2 className="eyebrow">Credenciais informadas</h2><ul className="mt-2 space-y-1 text-sm">{creds.map((c, i) => <li key={i}>{[c.type, c.number, c.issuer].filter(Boolean).join(" · ")}</li>)}</ul><p className="mt-1 text-xs text-muted-foreground">{p.verified_at ? "Conferidas pela equipe do Outro Ângulo. Isso não é garantia de resultado." : "Informadas pelo profissional, ainda não conferidas."}</p></section>}
      <section className="mt-6 text-sm"><h2 className="eyebrow">Atendimento</h2>
        <p className="mt-2 flex items-center gap-1"><MapPin className="h-4 w-4" />{[p.city, p.remote ? "Atende remoto" : null].filter(Boolean).join(" · ") || "Local não informado"}</p>
        {p.availability && <p>Disponibilidade: {p.availability}</p>}
        {p.budget_text && canShowBudget(p.categories) && <p>Faixa de orçamento: {p.budget_text}</p>}
      </section>
      {user?.id !== id && p.status === "approved" && (
        <div className="mt-8 flex flex-wrap gap-2">
          <Button onClick={() => setOpen(true)}>Solicitar proposta</Button>
          <Button variant="outline" onClick={talk}>Mensagem</Button>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Solicitar proposta a {name}</DialogTitle></DialogHeader>
          <RequestForm professionalId={id} defaultCategory={p.categories[0]} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </Page>
  );
}
