import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    modo: s.modo === "cadastro" ? ("cadastro" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Outro Ângulo" },
      { name: "description", content: "Entre ou crie sua conta no Outro Ângulo." },
      { property: "og:title", content: "Entrar — Outro Ângulo" },
      { property: "og:description", content: "Entre ou crie sua conta." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(72),
});

function AuthPage() {
  const { modo } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "cadastro">(modo === "cadastro" ? "cadastro" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/inicio", replace: true });
  }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "cadastro") {
        const p = signupSchema.safeParse({ name, email, password });
        if (!p.success) return toast.error(p.error.issues[0].message);
        const { error } = await supabase.auth.signUp({
          email: p.data.email,
          password: p.data.password,
          options: { emailRedirectTo: window.location.origin + "/inicio", data: { display_name: p.data.name } },
        });
        if (error) return toast.error(error.message.includes("registered") ? "Este e-mail já tem conta." : "Não foi possível criar a conta.");
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) return toast.error("E-mail ou senha incorretos, ou e-mail ainda não confirmado.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Não foi possível entrar com o Google.");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink p-12 text-ink-foreground md:flex md:flex-col md:justify-between">
        <Link to="/"><Logo className="[&_span.bg-ink]:bg-ink-foreground [&_span.bg-ink]:text-ink" /></Link>
        <p className="max-w-sm font-display text-3xl font-bold leading-tight">Habilidades para a vida que não veio com manual.</p>
        <span aria-hidden className="absolute -right-16 top-1/3 h-64 w-64 rotate-12 rounded-2xl border-2 border-primary" />
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden"><Logo /></Link>
          {sent ? (
            <div className="mt-8">
              <h1 className="text-2xl font-bold">Confira seu e-mail</h1>
              <p className="mt-2 text-muted-foreground">Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar, você já pode entrar.</p>
              <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setMode("login"); }}>Voltar para entrar</Button>
            </div>
          ) : (
            <>
              <h1 className="mt-8 text-2xl font-bold">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "login" ? "Que bom te ver de novo." : "A conta dá acesso à sua área. Os cursos são liberados por matrícula."}
              </p>
              <Button type="button" variant="outline" className="mt-6 w-full" onClick={google}>Continuar com Google</Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
              <form onSubmit={submit} className="space-y-4">
                {mode === "cadastro" && (
                  <div><Label htmlFor="name">Nome</Label><Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                )}
                <div><Label htmlFor="email">E-mail</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    {mode === "login" && <Link to="/recuperar-senha" className="text-xs text-primary hover:underline">Esqueci a senha</Link>}
                  </div>
                  <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}</Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "login" ? "Ainda não tem conta? " : "Já tem conta? "}
                <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setMode(mode === "login" ? "cadastro" : "login")}>
                  {mode === "login" ? "Criar conta" : "Entrar"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
