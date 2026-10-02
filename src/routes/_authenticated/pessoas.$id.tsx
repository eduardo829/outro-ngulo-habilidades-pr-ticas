import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, Page, Tag } from "@/components/community/Bits";
import { openConversation } from "@/lib/community";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/pessoas/$id")({
  head: () => ({ meta: [{ title: "Perfil de membro — Outro Ângulo" }, { name: "description", content: "Perfil de um membro da comunidade." }] }),
  component: Member,
});

function Block({ title, items, tone }: { title: string; items: string[]; tone?: "primary" }) {
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-1.5">{items.map((i) => <Tag key={i} tone={tone}>{i}</Tag>)}</div>
    </section>
  );
}

function Member() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: p, isLoading } = useQuery({
    queryKey: ["member", id],
    queryFn: async () => (await supabase.from("profiles").select("id, display_name, avatar_url, city, area, persona, working_on, bio, interests, skills, learn_tags, link").eq("id", id).maybeSingle()).data,
  });
  if (isLoading) return <Page narrow><p className="text-muted-foreground">Carregando…</p></Page>;
  if (!p) return <Page narrow><p>Membro não encontrado.</p></Page>;

  async function message() {
    try { const cid = await openConversation(p!.id); navigate({ to: "/mensagens/$id", params: { id: cid } }); }
    catch { toast.error("Não foi possível abrir a conversa."); }
  }

  return (
    <Page narrow>
      <Link to="/pessoas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Pessoas</Link>
      <div className="mt-6 flex items-center gap-5">
        <Avatar name={p.display_name} url={p.avatar_url} size="lg" />
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{p.display_name}</h1>
          {p.city && <p className="text-muted-foreground">{p.city}</p>}
          <p className="text-sm text-muted-foreground">{[p.persona, p.area !== p.persona ? p.area : null].filter(Boolean).join(" | ")}</p>
        </div>
      </div>
      {p.id !== user?.id ? (
        <Button className="mt-6" onClick={message}><Mail />Enviar mensagem</Button>
      ) : (
        <Button asChild variant="outline" className="mt-6"><Link to="/perfil">Editar meu perfil</Link></Button>
      )}
      {(p.bio || p.working_on) && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sobre</h2>
          {p.working_on && <p className="mt-3 leading-relaxed">{p.working_on}</p>}
          {p.bio && <p className="mt-2 leading-relaxed text-muted-foreground">{p.bio}</p>}
        </section>
      )}
      <Block title="Posso ajudar com" items={p.skills} tone="primary" />
      <Block title="Quero aprender" items={p.learn_tags} />
      <Block title="Interesses" items={p.interests} />
      {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer nofollow" className="mt-8 inline-block text-sm text-primary underline">Link profissional</a>}
    </Page>
  );
}
