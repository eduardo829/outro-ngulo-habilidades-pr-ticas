import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Expert } from "@/lib/events";
import { tagsFrom } from "@/lib/community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/gestores")({
  head: () => ({ meta: [{ title: "Gestores — Administração" }] }),
  component: Experts,
});

type F = { id?: string; name: string; headline: string; experience: string; area: string; topics: string; photo_url: string; active: boolean };
const empty: F = { name: "", headline: "", experience: "", area: "", topics: "", photo_url: "", active: true };

function Experts() {
  const [f, setF] = useState<F | null>(null);
  const list = useQuery({ queryKey: ["admin-experts"], queryFn: async () => ((await supabase.from("experts").select("*").order("position")).data ?? []) as Expert[] });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f || f.name.trim().length < 2) return toast.error("Informe o nome.");
    if (f.photo_url && !/^https:\/\//.test(f.photo_url)) return toast.error("Informe um link HTTPS para a foto.");
    const row = { name: f.name.trim(), headline: f.headline || null, experience: f.experience || null, area: f.area || null, topics: tagsFrom(f.topics), photo_url: f.photo_url || null, active: f.active };
    const { error } = f.id ? await supabase.from("experts").update(row).eq("id", f.id) : await supabase.from("experts").insert({ ...row, position: (list.data?.length ?? 0) + 1 });
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Gestor salvo."); setF(null); list.refetch();
  }
  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f!, [k]: e.target.value });
  return (
    <div>
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Gestores e especialistas</h2><Button onClick={() => setF(empty)}>Novo gestor</Button></div>
      {f && (
        <form onSubmit={save} className="mt-4 space-y-3 rounded-lg border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Nome</Label><Input value={f.name} onChange={set("name")} /></div>
            <div><Label>Título curto</Label><Input value={f.headline} onChange={set("headline")} placeholder="Empreendedor" /></div>
            <div><Label>Área de atuação</Label><Input value={f.area} onChange={set("area")} /></div>
            <div><Label>Foto (link HTTPS)</Label><Input value={f.photo_url} onChange={set("photo_url")} /></div>
          </div>
          <div><Label>Experiência real</Label><Textarea value={f.experience} onChange={set("experience")} placeholder="12+ anos empreendendo fora do Brasil." /></div>
          <div><Label>Temas (separados por vírgula)</Label><Input value={f.topics} onChange={set("topics")} /></div>
          <div className="flex items-center gap-2"><Switch checked={f.active} onCheckedChange={(c) => setF({ ...f, active: c })} /><Label>Visível para membros</Label></div>
          <div className="flex gap-2"><Button type="submit">Salvar</Button><Button type="button" variant="ghost" onClick={() => setF(null)}>Cancelar</Button></div>
        </form>
      )}
      <ul className="mt-4 divide-y rounded-lg border bg-card">
        {list.data?.map((x) => (
          <li key={x.id} className="flex items-center justify-between gap-3 p-4">
            <div><p className="font-medium">{x.name} {!x.active && <span className="text-xs text-muted-foreground">(oculto)</span>} {x.is_demo && <span className="text-xs text-muted-foreground">· demonstração</span>}</p><p className="text-sm text-muted-foreground">{x.headline} · {x.topics.join(", ")}</p></div>
            <Button size="sm" variant="outline" onClick={() => setF({ id: x.id, name: x.name, headline: x.headline ?? "", experience: x.experience ?? "", area: x.area ?? "", topics: x.topics.join(", "), photo_url: x.photo_url ?? "", active: x.active })}>Editar</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
