import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Visão geral", exact: true },
  { to: "/admin/cursos", label: "Cursos" },
  { to: "/admin/videos", label: "Vídeos das aulas" },
  { to: "/admin/alunos", label: "Alunos e matrículas" },
  { to: "/admin/encontros", label: "Encontros" },
  { to: "/admin/gestores", label: "Gestores" },
  { to: "/admin/comunidade", label: "Comunidade" },
  { to: "/admin/configuracoes", label: "Configurações" },
] as const;

function AdminLayout() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <p className="p-8 text-muted-foreground">Carregando…</p>;
  // UI gate only — every admin write is enforced by database policies.
  if (!isAdmin) return <div className="p-8"><h1 className="text-xl font-bold">Acesso restrito</h1><p className="mt-2 text-muted-foreground">Esta área é exclusiva da administração.</p></div>;
  return (
    <div>
      <div className="border-b bg-card px-5 pt-6 md:px-8">
        <h1 className="text-2xl font-extrabold">Administração</h1>
        <nav className="mt-4 flex gap-1 overflow-x-auto" aria-label="Seções da administração">
          {TABS.map((t) => (
            <Link key={t.to} to={t.to} activeOptions={{ exact: "exact" in t }} className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground" activeProps={{ className: "!border-primary !text-foreground" }}>
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8"><Outlet /></div>
    </div>
  );
}
