import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listAccounts } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/alunos")({
  head: () => ({ meta: [
    { title: "Usuários e matrículas — Administração Outro Ângulo" },
    { name: "description", content: "Confira cadastros, confirmação de e-mail e matrículas no Outro Ângulo." },
    { property: "og:title", content: "Usuários e matrículas — Administração Outro Ângulo" },
    { property: "og:description", content: "Gestão de usuários e acessos aos cursos." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Students,
});

function Students() {
  const { user } = useAuth();
  const fetchAccounts = useServerFn(listAccounts);
  const accounts = useQuery({ queryKey: ["admin-accounts"], queryFn: () => fetchAccounts(), refetchInterval: 60000 });
  const courses = useQuery({ queryKey: ["admin-courses-min"], queryFn: async () => {
    const { data, error } = await supabase.from("courses").select("id, title").order("position");
    if (error) throw error;
    return data ?? [];
  } });
  const enrollments = useQuery({ queryKey: ["admin-enrollments"], refetchInterval: 60000, queryFn: async () => {
    const { data, error } = await supabase.from("enrollments").select("id, user_id, course_id, status");
    if (error) throw error;
    return data ?? [];
  } });
  const [search, setSearch] = useState("");
  const [pick, setPick] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");

  const list = useMemo(() => {
    const s = search.toLowerCase();
    return (accounts.data ?? []).filter((a) => {
      const matches = !s || a.email.toLowerCase().includes(s) || a.display_name.toLowerCase().includes(s);
      const status = filter === "all" || (filter === "unconfirmed" && !a.email_confirmed_at) || (filter === "active" && enrollments.data?.some((e) => e.user_id === a.id && e.status === "active"));
      return matches && status;
    });
  }, [accounts.data, search, filter, enrollments.data]);

  const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : "Ainda não entrou";
  const refresh = () => { accounts.refetch(); enrollments.refetch(); courses.refetch(); };

  const courseTitle = (id: string) => courses.data?.find((c) => c.id === id)?.title ?? "—";

  async function enroll(userId: string) {
    const courseId = pick[userId];
    if (!courseId) return toast.error("Escolha um curso.");
    if (!user) return;
    const { error } = await supabase.from("enrollments").upsert(
      { user_id: userId, course_id: courseId, status: "active", source: "manual", granted_by: user.id },
      { onConflict: "user_id,course_id" },
    );
    error ? toast.error("Não foi possível realizar a matrícula.") : toast.success("Matrícula ativa.");
    enrollments.refetch();
  }
  async function setEnrollment(id: string, status: "active" | "revoked") {
    const { error } = await supabase.from("enrollments").update({ status }).eq("id", id);
    error ? toast.error("Falha ao atualizar.") : toast.success(status === "revoked" ? "Acesso revogado." : "Acesso reativado.");
    enrollments.refetch();
  }
  async function toggleRole(userId: string, role: "moderator" | "admin", has: boolean) {
    if (!confirm(has ? `Remover papel ${role}?` : `Conceder papel ${role}?`)) return;
    const { error } = has
      ? await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role)
      : await supabase.from("user_roles").insert({ user_id: userId, role });
    error ? toast.error("Não permitido.") : toast.success("Papel atualizado.");
    accounts.refetch();
  }

  if (accounts.isLoading || enrollments.isLoading || courses.isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (accounts.isError || enrollments.isError || courses.isError) return <div role="alert"><p className="text-destructive">Não foi possível carregar as contas e matrículas.</p><Button variant="outline" className="mt-4" onClick={refresh}>Tentar novamente</Button></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><h1 className="font-display text-2xl font-bold">Usuários</h1><Button variant="outline" size="icon" aria-label="Atualizar usuários" title="Atualizar usuários" disabled={accounts.isFetching} onClick={refresh}><RefreshCw className={accounts.isFetching ? "animate-spin" : ""} /></Button></div>
      <label htmlFor="q" className="sr-only">Buscar</label>
      <Input id="q" placeholder="Buscar por nome ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{list.length} usuários · mais recentes primeiro</p><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-56" aria-label="Filtrar usuários"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os usuários</SelectItem><SelectItem value="unconfirmed">E-mail não confirmado</SelectItem><SelectItem value="active">Com acesso ativo</SelectItem></SelectContent></Select></div>
      {!list.length && <p className="py-8 text-muted-foreground">Nenhum usuário encontrado.</p>}
      <ul className="space-y-3">
        {list.map((a) => {
          const mine = (enrollments.data ?? []).filter((e) => e.user_id === a.id);
          const self = a.id === user?.id;
          return (
            <li key={a.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{a.display_name || "(sem nome)"}</span>
                <span className="break-all text-sm text-muted-foreground">{a.email}</span>
                {a.roles.filter((r) => r !== "member").map((r) => <Badge key={r}>{r === "admin" ? "Administrador" : r === "gestor" ? "Gestor" : "Moderador"}</Badge>)}
                {!self && (
                  <div className="ml-auto flex flex-wrap gap-1">
                    <Button size="sm" variant="ghost" onClick={() => toggleRole(a.id, "moderator", a.roles.includes("moderator"))}>{a.roles.includes("moderator") ? "Remover moderador" : "Tornar moderador"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleRole(a.id, "admin", a.roles.includes("admin"))}>{a.roles.includes("admin") ? "Remover admin" : "Tornar admin"}</Button>
                  </div>
                )}
              </div>
              <dl className="mt-3 grid gap-3 border-t pt-3 text-sm sm:grid-cols-3"><div><dt className="text-muted-foreground">Cadastro (Brasília)</dt><dd>{date(a.created_at)}</dd></div><div><dt className="text-muted-foreground">E-mail</dt><dd>{a.email_confirmed_at ? "Confirmado" : "Aguardando confirmação"}</dd></div><div><dt className="text-muted-foreground">Último login (Brasília)</dt><dd>{date(a.last_sign_in_at)}</dd></div></dl>
              {!mine.length && <p className="mt-3 text-sm text-muted-foreground">Sem matrícula em cursos.</p>}
              {mine.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {mine.map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center gap-2">
                      <span className="flex-1">{courseTitle(e.course_id)}</span>
                      <Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status === "active" ? "Ativa" : "Revogada"}</Badge>
                      {!self && (e.status === "active"
                        ? <Button size="sm" variant="outline" onClick={() => confirm("Revogar acesso a este curso?") && setEnrollment(e.id, "revoked")}>Revogar</Button>
                        : <Button size="sm" variant="outline" onClick={() => setEnrollment(e.id, "active")}>Reativar</Button>)}
                    </li>
                  ))}
                </ul>
              )}
              {!self && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Select value={pick[a.id] ?? ""} onValueChange={(v) => setPick({ ...pick, [a.id]: v })}>
                    <SelectTrigger className="max-w-xs" aria-label="Curso para matrícula"><SelectValue placeholder="Matricular em…" /></SelectTrigger>
                    <SelectContent>{courses.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => enroll(a.id)}>Matricular</Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
