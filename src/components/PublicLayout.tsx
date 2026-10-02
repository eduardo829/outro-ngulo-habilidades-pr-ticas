import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:p-2">
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link to="/" aria-label="Outro Ângulo — início">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <Link to="/cursos" className="hover:text-primary" activeProps={{ className: "text-primary" }}>
              Cursos
            </Link>
            <Link to="/sobre" className="hover:text-primary" activeProps={{ className: "text-primary" }}>
              Sobre
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link to="/inicio">Minha área</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth" search={{ modo: "cadastro" }}>Criar conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="conteudo" className="flex-1">{children}</main>
      <footer className="border-t bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
          <div>
            <Logo className="[&_span.bg-ink]:bg-ink-foreground [&_span.bg-ink]:text-ink" />
            <p className="mt-3 max-w-xs text-sm opacity-75">Habilidades para a vida que não veio com manual.</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm opacity-85">
            <Link to="/cursos">Cursos</Link>
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
