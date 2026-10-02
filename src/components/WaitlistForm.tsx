import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email("E-mail inválido").max(255),
});

export function WaitlistForm({ courseId }: { courseId?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ name: name || undefined, email });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setState("sending");
    const { error } = await supabase.from("waitlist").insert({
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name ?? null,
      course_id: courseId ?? null,
    });
    if (error) {
      setState("idle");
      return toast.error("Não foi possível registrar. Tente novamente.");
    }
    setState("done");
  }

  if (state === "done")
    return <p className="rounded-md bg-accent p-4 text-accent-foreground">Pronto! Você está na lista de interesse.</p>;

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="wl-name">Nome (opcional)</Label>
        <Input id="wl-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
      </div>
      <div>
        <Label htmlFor="wl-email">E-mail</Label>
        <Input id="wl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
      </div>
      <Button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Enviando…" : "Entrar na lista de interesse"}
      </Button>
      <p className="text-xs text-muted-foreground">Usamos seu e-mail só para avisar sobre a abertura dos cursos.</p>
    </form>
  );
}
