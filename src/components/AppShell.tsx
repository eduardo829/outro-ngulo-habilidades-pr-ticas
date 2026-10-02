import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Home, BookOpen, User, Shield, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/meus-cursos", label: "Cursos", icon: BookOpen },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const linkCls = "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground";
  const active = { className: "bg-accent !text-accent-foreground" };

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r bg-sidebar p-4 md:flex">
        <Link to="/" className="px-2 py-2"><Logo /></Link>
        <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label="Navegação principal">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={linkCls} activeProps={active}>
              <Icon className="h-4 w-4" aria-hidden />{label === "Cursos" ? "Meus cursos" : label}
            </Link>
          ))}
          <Link to="/cursos" className={linkCls}><BookOpen className="h-4 w-4" aria-hidden />Catálogo</Link>
          {isAdmin && (
            <Link to="/admin" className={cn(linkCls, "mt-4")} activeProps={active}>
              <Shield className="h-4 w-4" aria-hidden />Administração
            </Link>
          )}
        </nav>
        <button onClick={signOut} className={linkCls}><LogOut className="h-4 w-4" aria-hidden />Sair</button>
      </aside>

      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
          <Link to="/inicio"><Logo /></Link>
          <div className="flex items-center gap-1">
            {isAdmin && <Link to="/admin" className="rounded-md p-2" aria-label="Administração"><Shield className="h-5 w-5" /></Link>}
            <button onClick={signOut} className="rounded-md p-2" aria-label="Sair"><LogOut className="h-5 w-5" /></button>
          </div>
        </header>
        <main id="conteudo" className="flex-1">{children}</main>
      </div>

      <nav aria-label="Navegação inferior" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t bg-background md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground" activeProps={{ className: "!text-primary" }}>
            <Icon className="h-5 w-5" aria-hidden />{label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b bg-card px-5 py-6 md:px-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
      {children}
    </div>
  );
}
