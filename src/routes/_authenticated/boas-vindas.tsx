import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GOALS, PERSONAS } from "@/lib/community";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/boas-vindas")({
  head: () => ({ meta: [{ title: "Boas-vindas — Outro Ângulo" }, { name: "description", content: "Conte um pouco sobre você." }] }),
  component: Onboarding,
});

function Chip({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cn("rounded-full border px-4 py-2 text-sm transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground/40")}>
      {children}
    </button>
  );
}

function Onboarding() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState("");
  const [working, setWorking] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [canHelp, setCanHelp] = useState("");
  const [wantHelp, setWantHelp] = useState("");
  const [busy, setBusy] = useState(false);

  const steps = [
    { q: "O que melhor descreve você?", ok: !!persona, body: <div className="flex flex-wrap gap-2">{PERSONAS.map((p) => <Chip key={p} on={persona === p} onClick={() => setPersona(p)}>{p}</Chip>)}</div> },
    { q: "Em que você está trabalhando atualmente?", ok: working.trim().length > 2, body: <Textarea value={working} onChange={(e) => setWorking(e.target.value)} maxLength={300} placeholder="Ex.: abrindo uma agência de marketing, terminando a faculdade de engenharia…" className="min-h-28" /> },
    { q: "O que você quer desenvolver?", hint: "Escolha até 3.", ok: goals.length > 0, body: <div className="flex flex-wrap gap-2">{GOALS.map((g) => <Chip key={g} on={goals.includes(g)} onClick={() => setGoals(goals.includes(g) ? goals.filter((x) => x !== g) : goals.length < 3 ? [...goals, g] : goals)}>{g}</Chip>)}</div> },
    { q: "Em que você poderia ajudar outra pessoa?", hint: "Separe por vírgulas. Vale experiência de trabalho, hobby ou estudo.", ok: canHelp.trim().length > 1, body: <Textarea value={canHelp} onChange={(e) => setCanHelp(e.target.value)} maxLength={300} placeholder="Ex.: Vendas, Excel, Atendimento ao cliente" className="min-h-28" /> },
    { q: "Em que você gostaria de receber ajuda?", hint: "Separe por vírgulas.", ok: wantHelp.trim().length > 1, body: <Textarea value={wantHelp} onChange={(e) => setWantHelp(e.target.value)} maxLength={300} placeholder="Ex.: Networking, Precificação, Falar em público" className="min-h-28" /> },
  ];
  const s = steps[step]!;

  async function finish() {
    setBusy(true);
    const split = (t: string) => t.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 10);
    const { error } = await supabase.from("profiles").update({
      persona, working_on: working.trim(), interests: goals, skills: split(canHelp), learn_tags: split(wantHelp),
      can_share: canHelp.trim(), wants_learn: wantHelp.trim(), area: persona, onboarded: true, in_directory: true,
      updated_at: new Date().toISOString(),
    }).eq("id", user!.id);
    setBusy(false);
    if (error) return toast.error("Não foi possível salvar. Tente de novo.");
    await qc.invalidateQueries({ queryKey: ["me"] });
    navigate({ to: "/inicio", replace: true });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-8">
      <Logo />
      <div className="mt-12 flex gap-1.5" aria-label={`Etapa ${step + 1} de ${steps.length}`}>
        {steps.map((_, i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-border")} />)}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">{step + 1} de {steps.length}</p>
      <h1 className="mt-2 text-2xl font-extrabold md:text-3xl">{s.q}</h1>
      {"hint" in s && s.hint && <p className="mt-2 text-muted-foreground">{s.hint}</p>}
      <div className="mt-6">{s.body}</div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-10">
        <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>Voltar</Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!s.ok}>Continuar</Button>
        ) : (
          <Button onClick={finish} disabled={!s.ok || busy}>{busy ? "Salvando…" : "Entrar na plataforma"}</Button>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Suas respostas aparecem no seu perfil para outros membros. Você pode editar ou se ocultar de “Pessoas” a qualquer momento.</p>
    </div>
  );
}
