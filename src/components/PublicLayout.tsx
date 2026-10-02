import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/trilhas", label: "Trilhas" },
  { to: "/cursos", label: "Cursos" },
  { to: "/conheca-a-comunidade", label: "Comunidade" },
  { to: "/conheca-os-encontros", label: "Encontros" },
  { to: "/oportunidades", label: "Oportunidades" },
  { to: "/gestores", label: "Gestores" },
  { to: "/sobre", label: "Sobre" },
] as const;

export function PublicLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:p-2">
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link to="/" aria-label="Outro Ângulo — início">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium lg:flex" aria-label="Principal">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="nav-line" activeProps={{ className: "text-foreground font-semibold" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link to="/inicio">Minha área</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth" search={{ modo: "cadastro" }}>Fazer parte</Link>
                </Button>
              </>
            )}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <nav className="mt-8 flex flex-col" aria-label="Menu móvel">
                  {NAV.map((n, i) => (
                    <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="flex items-baseline gap-3 border-b py-3 font-display text-lg font-semibold">
                      <span className="text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>{n.label}
                    </Link>
                  ))}
                  {!user && <Link to="/auth" onClick={() => setOpen(false)} className="py-4 text-sm font-medium text-primary">Entrar</Link>}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main id="conteudo" className="flex-1">{children}</main>
      <footer className="border-t bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
          <div>
            <Logo className="[&_span.bg-ink]:bg-ink-foreground [&_span.bg-ink]:text-ink" />
            <p className="mt-4 max-w-xs font-display text-lg font-semibold leading-snug">Existe sempre<br />outro ângulo.</p>
            <p className="mt-2 max-w-xs text-sm opacity-65">Habilidades para a vida que não veio com manual.</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm opacity-85">
            <Link to="/trilhas">Trilhas</Link>
            <Link to="/cursos">Cursos</Link>
            <Link to="/conheca-a-comunidade">Comunidade</Link>
            <Link to="/conheca-os-encontros">Encontros</Link>
            <Link to="/sobre">Sobre o projeto</Link>
            <Link to="/diretrizes">Diretrizes da comunidade</Link>
          </nav>
          <nav className="flex flex-col gap-2 text-sm opacity-85">
            <Link to="/privacidade">Privacidade</Link>
            <Link to="/termos">Termos de uso</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function DraftNotice() {
  return (
    <p className="rounded-md border border-dashed border-primary/40 bg-accent px-4 py-3 text-sm text-accent-foreground">
      <strong>Rascunho.</strong> Este texto é provisório e ainda não foi revisado juridicamente. Ele será substituído pela versão aprovada.
    </p>
  );
}
