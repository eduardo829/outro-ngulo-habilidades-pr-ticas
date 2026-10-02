import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PERSONAS } from "@/lib/community";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — Outro Ângulo" }, { name: "description", content: "Edite seu perfil e preferências." }] }),
  component: ProfilePage,
});

const schema = z.object({
  display_name: z.string().trim().min(2, "Nome muito curto").max(80),
  bio: z.string().max(300).optional(),
  city: z.string().max(80).optional(),
  area: z.string().max(80).optional(),
  can_share: z.string().max(300).optional(),
  wants_learn: z.string().max(300).optional(),
  link: z.union([z.literal(""), z.string().url("Link inválido").max(255)]).optional(),
});

type Form = { display_name: string; bio: string; city: string; area: string; interests: string; can_share: string; wants_learn: string; link: string; avatar_url: string; in_directory: boolean; persona: string; working_on: string; skills: string; learn_tags: string };

function ProfilePage() {
  const { user } = useAuth();
  const [f, setF] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) setF({
        display_name: data.display_name, bio: data.bio ?? "", city: data.city ?? "", area: data.area ?? "",
        interests: data.interests.join(", "), can_share: data.can_share ?? "", wants_learn: data.wants_learn ?? "",
        link: data.link ?? "", avatar_url: data.avatar_url ?? "", in_directory: data.in_directory,
        persona: data.persona ?? "", working_on: data.working_on ?? "", skills: data.skills.join(", "), learn_tags: data.learn_tags.join(", "),
      });
    });
  }, [user]);

  if (!f) return <><PageHeader title="Meu perfil" /><p className="p-8 text-muted-foreground">Carregando…</p></>;
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) return toast.error(p.error.issues[0]?.message ?? "Dados inválidos");
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      display_name: f!.display_name.trim(), bio: f!.bio || null, city: f!.city || null, area: f!.area || null,
      interests: f!.interests.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12),
      can_share: f!.can_share || null, wants_learn: f!.wants_learn || null, link: f!.link || null,
      in_directory: f!.in_directory, persona: f!.persona || null, working_on: f!.working_on || null,
      skills: f!.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10),
      learn_tags: f!.learn_tags.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10), updated_at: new Date().toISOString(),
    }).eq("id", user!.id);
    setBusy(false);
    error ? toast.error("Não foi possível salvar.") : toast.success("Perfil salvo.");
  }

  async function uploadAvatar(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024)
      return toast.error("Use JPG, PNG ou WEBP de até 2 MB.");
    const path = `${user!.id}/avatar-${Date.now()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) return toast.error("Falha no envio da foto.");
    const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user!.id);
    setF({ ...f!, avatar_url: url });
    toast.success("Foto atualizada.");
  }

  return (
    <>
      <PageHeader title="Meu perfil" />
      <form onSubmit={save} className="mx-auto max-w-2xl space-y-5 px-5 py-8 md:px-8">
        <div className="flex items-center gap-4">
          {f.avatar_url ? <img src={f.avatar_url} alt="Sua foto" className="h-16 w-16 rounded-lg object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary font-display text-xl font-bold">{f.display_name[0]}</div>}
          <div>
            <Label htmlFor="avatar">Foto</Label>
            <Input id="avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">E-mail de acesso: {user?.email} (nunca aparece para outros membros)</p>
        <div><Label htmlFor="dn">Nome de exibição</Label><Input id="dn" value={f.display_name} onChange={set("display_name")} /></div>
        <div><Label htmlFor="bio">Bio curta</Label><Textarea id="bio" value={f.bio} onChange={set("bio")} maxLength={300} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="city">Cidade (opcional)</Label><Input id="city" value={f.city} onChange={set("city")} /></div>
          <div><Label htmlFor="area">Área de atuação</Label><Input id="area" value={f.area} onChange={set("area")} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="persona">O que melhor descreve você</Label><select id="persona" value={f.persona} onChange={(e) => setF({ ...f, persona: e.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">—</option>{PERSONAS.map((p) => <option key={p}>{p}</option>)}</select></div>
          <div><Label htmlFor="wo">No que está trabalhando</Label><Input id="wo" value={f.working_on} onChange={set("working_on")} maxLength={300} /></div>
        </div>
        <div><Label htmlFor="skills">Posso ajudar com (etiquetas separadas por vírgula)</Label><Input id="skills" value={f.skills} onChange={set("skills")} placeholder="Vendas, Marketing, Excel" /></div>
        <div><Label htmlFor="lt">Quero aprender (etiquetas separadas por vírgula)</Label><Input id="lt" value={f.learn_tags} onChange={set("learn_tags")} placeholder="IA, Networking" /></div>
        <div><Label htmlFor="int">O que quero desenvolver (separe por vírgula)</Label><Input id="int" value={f.interests} onChange={set("interests")} /></div>
        <div><Label htmlFor="share">Em que eu poderia ajudar outra pessoa</Label><Textarea id="share" value={f.can_share} onChange={set("can_share")} maxLength={300} /></div>
        <div><Label htmlFor="learn">Em que gostaria de receber ajuda</Label><Textarea id="learn" value={f.wants_learn} onChange={set("wants_learn")} maxLength={300} /></div>
        <div><Label htmlFor="link">LinkedIn ou link profissional (opcional)</Label><Input id="link" type="url" value={f.link} onChange={set("link")} placeholder="https://" /></div>
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div><Label htmlFor="dir">Aparecer em “Pessoas”</Label><p className="text-xs text-muted-foreground">Opcional. Seu e-mail nunca é exibido.</p></div>
          <Switch id="dir" checked={f.in_directory} onCheckedChange={(c) => setF({ ...f, in_directory: c })} />
        </div>
        <Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar perfil"}</Button>
      </form>
    </>
  );
}
