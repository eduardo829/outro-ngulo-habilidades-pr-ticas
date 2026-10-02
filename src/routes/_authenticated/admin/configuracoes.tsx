import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { settingsQuery, type Founder } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Administração" }] }),
  component: Settings,
});

async function saveSetting(key: string, value: unknown) {
  const { error } = await supabase.from("site_settings").upsert({ key, value: value as never, updated_at: new Date().toISOString() });
  error ? toast.error("Falha ao salvar.") : toast.success("Salvo.");
}

function Settings() {
  const { user } = useAuth();
  const s = useQuery(settingsQuery);
  const [founders, setFounders] = useState<Founder[]>([]);
  const [price, setPrice] = useState("99,00");
  const [label, setLabel] = useState("Pagamento único");
  const [support, setSupport] = useState("");
  const [ann, setAnn] = useState({ title: "", body: "" });
  const waitlist = useQuery({ queryKey: ["admin-waitlist"], queryFn: async () => (await supabase.from("waitlist").select("id, email, name, created_at, courses(title)").order("created_at", { ascending: false })).data ?? [] });

  useEffect(() => {
    if (!s.data) return;
    setFounders(s.data.founders);
    setPrice((s.data.offer.price_cents / 100).toFixed(2).replace(".", ","));
    setLabel(s.data.offer.label);
    setSupport(s.data.support.email ?? "");
  }, [s.data]);

  async function postAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!ann.title.trim() || !ann.body.trim()) return toast.error("Preencha título e texto.");
    const { error } = await supabase.from("announcements").insert({ title: ann.title.trim().slice(0, 140), body: ann.body.trim().slice(0, 4000), created_by: user!.id });
    error ? toast.error("Falha ao publicar.") : (toast.success("Aviso publicado."), setAnn({ title: "", body: "" }));
  }

  return (
    <div className="space-y-10">
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-bold">Fundadores</h2>
        <div className="mt-4 space-y-5">
          {founders.map((f, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor={`fn${i}`}>Nome</Label><Input id={`fn${i}`} value={f.name} onChange={(e) => setFounders(founders.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></div>
              <div><Label htmlFor={`fp${i}`}>URL da foto</Label><Input id={`fp${i}`} type="url" value={f.photo_url ?? ""} onChange={(e) => setFounders(founders.map((x, j) => j === i ? { ...x, photo_url: e.target.value || null } : x))} /></div>
              <div className="sm:col-span-2"><Label htmlFor={`fb${i}`}>Biografia</Label><Textarea id={`fb${i}`} value={f.bio} onChange={(e) => setFounders(founders.map((x, j) => j === i ? { ...x, bio: e.target.value } : x))} /></div>
            </div>
          ))}
        </div>
        <Button className="mt-4" onClick={() => saveSetting("founders", founders)}>Salvar fundadores</Button>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-bold">Oferta e pagamentos</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pagamento on-line ainda não está ativado. Enquanto isso, as páginas dos cursos mostram a lista de interesse e você matricula alunos manualmente.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="pr">Valor padrão (R$)</Label><Input id="pr" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          <div><Label htmlFor="lb">Descrição</Label><Input id="lb" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        </div>
        <Button className="mt-4" onClick={() => {
          const cents = Math.round(Number(price.replace(/\./g, "").replace(",", ".")) * 100);
          if (!Number.isFinite(cents) || cents < 0) return toast.error("Valor inválido.");
          saveSetting("offer", { price_cents: cents, label, payments_enabled: false });
        }}>Salvar oferta</Button>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-bold">Canal de suporte</h2>
        <div className="mt-3"><Label htmlFor="sup">E-mail de suporte</Label><Input id="sup" type="email" value={support} onChange={(e) => setSupport(e.target.value)} /></div>
        <Button className="mt-4" onClick={() => saveSetting("support", { email: support || null })}>Salvar</Button>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-bold">Publicar aviso da equipe</h2>
        <form onSubmit={postAnnouncement} className="mt-3 space-y-3">
          <div><Label htmlFor="at">Título</Label><Input id="at" value={ann.title} onChange={(e) => setAnn({ ...ann, title: e.target.value })} maxLength={140} /></div>
          <div><Label htmlFor="ab">Texto</Label><Textarea id="ab" value={ann.body} onChange={(e) => setAnn({ ...ann, body: e.target.value })} maxLength={4000} /></div>
          <Button type="submit">Publicar aviso</Button>
        </form>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-bold">Lista de interesse ({waitlist.data?.length ?? 0})</h2>
        {waitlist.data?.length ? (
          <ul className="mt-3 divide-y text-sm">
            {waitlist.data.map((w) => (
              <li key={w.id} className="flex flex-wrap gap-2 py-2">
                <span className="font-medium">{w.email}</span>
                {w.name && <span className="text-muted-foreground">{w.name}</span>}
                <span className="ml-auto text-muted-foreground">{w.courses?.title ?? "Geral"} · {new Date(w.created_at).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted-foreground">Ninguém na lista ainda.</p>}
      </section>
    </div>
  );
}
