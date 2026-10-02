import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { Home, BookOpen, User, Shield, LogOut, Users, CalendarDays, MessagesSquare, Bell, Mail, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/meus-cursos", label: "Meus cursos", short: "Cursos", icon: BookOpen },
  { to: "/comunidade", label: "Comunidade", icon: MessagesSquare },
  { to: "/encontros", label: "Encontros", icon: CalendarDays },
  { to: "/pessoas", label: "Pessoas", icon: Users },
  { to: "/perfil", label: "Meu perfil", icon: User },
] as const;

export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["me", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).single()).data,
  });
}

function useUnread() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread", user?.id],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async () => {
      await supabase.rpc("ensure_event_reminders");
      const { data } = await supabase.from("notifications").select("kind").is("read_at", null).eq("user_id", user!.id);
      const rows = data ?? [];
      return { all: rows.filter((r) => r.kind !== "message").length, messages: rows.filter((r) => r.kind === "message").length };
    },
  });
}

function Badge({ n }: { n?: number | undefined }) {
  if (!n) return null;
  return <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{n > 9 ? "9+" : n}</span>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const me = useMyProfile();
  const unread = useUnread();

  useEffect(() => {
    if (me.data && !me.data.onboarded && path !== "/boas-vindas") navigate({ to: "/boas-vindas", replace: true });
  }, [me.data, path, navigate]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (path === "/boas-vindas") return <main id="conteudo" className="min-h-screen bg-background">{children}</main>;

  const linkCls = "relative flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground before:absolute before:left-0 before:top-1/2 before:h-3 before:w-3 before:-translate-y-1/2 before:border-b-2 before:border-l-2 before:border-highlight before:opacity-0 before:transition-all before:duration-300 [&>svg]:transition-transform hover:[&>svg]:translate-x-0.5";
  const active = { className: "!text-foreground font-semibold before:!opacity-100 [&>svg]:translate-x-1" };
  const iconBtn = "relative rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground";

  return (
    <div className="min-h-screen md:grid md:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r bg-sidebar p-4 md:flex">
        <Link to="/inicio" className="px-2 py-2"><Logo /></Link>
        <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label="Navegação principal">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={linkCls} activeProps={active}>
              <Icon className="h-4 w-4" aria-hidden />{label}
            </Link>
          ))}
          <div className="my-3 border-t" />
          <Link to="/mensagens" className={linkCls} activeProps={active}><Mail className="h-4 w-4" aria-hidden />Mensagens{!!unread.data?.messages && <span className="ml-auto text-xs text-primary">{unread.data.messages}</span>}</Link>
          <Link to="/notificacoes" className={linkCls} activeProps={active}><Bell className="h-4 w-4" aria-hidden />Notificações{!!unread.data?.all && <span className="ml-auto text-xs text-primary">{unread.data.all}</span>}</Link>
          <Link to="/cursos" className={linkCls}><LayoutGrid className="h-4 w-4" aria-hidden />Catálogo</Link>
          {isAdmin && (
            <Link to="/admin" className={cn(linkCls, "mt-3")} activeProps={active}><Shield className="h-4 w-4" aria-hidden />Administração</Link>
          )}
        </nav>
        <button onClick={signOut} className={linkCls}><LogOut className="h-4 w-4" aria-hidden />Sair</button>
      </aside>

      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
          <Link to="/inicio"><Logo /></Link>
          <div className="flex items-center">
            <Link to="/mensagens" className={iconBtn} aria-label="Mensagens"><Mail className="h-5 w-5" /><Badge n={unread.data?.messages} /></Link>
            <Link to="/notificacoes" className={iconBtn} aria-label="Notificações"><Bell className="h-5 w-5" /><Badge n={unread.data?.all} /></Link>
            <Link to="/perfil" className={iconBtn} aria-label="Meu perfil"><User className="h-5 w-5" /></Link>
            {isAdmin && <Link to="/admin" className={iconBtn} aria-label="Administração"><Shield className="h-5 w-5" /></Link>}
            <button onClick={signOut} className={iconBtn} aria-label="Sair"><LogOut className="h-5 w-5" /></button>
          </div>
        </header>
        <main id="conteudo" className="flex-1">{children}</main>
      </div>

      <nav aria-label="Navegação inferior" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background md:hidden">
        {NAV.slice(0, 5).map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground" activeProps={{ className: "!text-foreground font-semibold [&>svg]:text-primary shadow-[inset_0_2px_0_var(--color-highlight)]" }}>
            <n.icon className="h-5 w-5" aria-hidden />{"short" in n ? n.short : n.label}
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
