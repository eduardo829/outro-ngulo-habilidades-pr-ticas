import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Outro Ângulo" },
      { name: "description", content: "Defina uma nova senha para sua conta." },
      { property: "og:title", content: "Nova senha — Outro Ângulo" },
      { property: "og:description", content: "Defina uma nova senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("A senha precisa ter pelo menos 8 caracteres.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) { setInvalid(true); return; }
      toast.success("Senha atualizada.");
      navigate({ to: "/meus-cursos" });
    } catch {
      toast.error("Não foi possível conectar agora. Tente novamente em instantes.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <Logo />
        <h1 className="pt-4 text-2xl font-bold">Criar nova senha</h1>
        <div><Label htmlFor="pw">Nova senha</Label><Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Salvando…" : "Salvar senha"}</Button>
        {invalid && <div role="alert" className="text-sm"><p className="text-destructive">Link inválido ou expirado.</p><Button asChild variant="link" className="h-auto px-0"><Link to="/recuperar-senha">Pedir um novo link</Link></Button></div>}
      </form>
    </div>
  );
}
