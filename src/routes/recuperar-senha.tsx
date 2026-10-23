import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Outro Ângulo" },
      { name: "description", content: "Receba um link para criar uma nova senha." },
      { property: "og:title", content: "Recuperar senha — Outro Ângulo" },
      { property: "og:description", content: "Receba um link para criar uma nova senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      if (error) return toast.error("Não foi possível enviar agora. Tente novamente.");
      setSent(true);
    } catch {
      toast.error("Não foi possível conectar agora. Tente novamente em instantes.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Link to="/"><Logo /></Link>
        <h1 className="mt-8 text-2xl font-bold">Recuperar senha</h1>
        {sent ? (
          <p className="mt-3 text-muted-foreground">Se houver uma conta com este e-mail, você receberá um link para criar uma nova senha.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Se você comprou um curso, use o mesmo e-mail informado no pagamento.</p>
            <div><Label htmlFor="email">E-mail</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Enviando…" : "Enviar link"}</Button>
          </form>
        )}
        <Link to="/auth" className="mt-6 inline-block text-sm text-primary hover:underline">Voltar para entrar</Link>
      </div>
    </div>
  );
}
