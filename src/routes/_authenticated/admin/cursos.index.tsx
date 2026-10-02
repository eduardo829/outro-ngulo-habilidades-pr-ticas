import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/cursos/")({
  head: () => ({ meta: [{ title: "Cursos — Administração" }] }),
  component: AdminCourses,
});

export const STATUS_LABEL = { draft: "Rascunho", published: "Publicado", archived: "Arquivado" } as const;

function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

function AdminCourses() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const { data, refetch } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => (await supabase.from("courses").select("id, slug, title, status, position").order("position")).data ?? [],
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) return toast.error("Informe um título.");
    const { data: c, error } = await supabase.from("courses").insert({ title: title.trim(), slug: `${slugify(title)}-${Date.now().toString(36).slice(-4)}`, position: (data?.length ?? 0) + 1 }).select("id").single();
    if (error) return toast.error("Não foi possível criar.");
    setTitle("");
    refetch();
    navigate({ to: "/admin/cursos/$id", params: { id: c.id } });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="flex gap-2">
        <label htmlFor="newc" className="sr-only">Título do novo curso</label>
        <Input id="newc" placeholder="Título do novo curso" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button type="submit">Criar curso</Button>
      </form>
      <ul className="divide-y rounded-lg border bg-card">
        {data?.map((c) => (
          <li key={c.id}>
            <Link to="/admin/cursos/$id" params={{ id: c.id }} className="flex items-center justify-between gap-3 p-4 hover:bg-secondary">
              <span className="font-medium">{c.title}</span>
              <Badge variant={c.status === "published" ? "default" : "secondary"}>{STATUS_LABEL[c.status]}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
