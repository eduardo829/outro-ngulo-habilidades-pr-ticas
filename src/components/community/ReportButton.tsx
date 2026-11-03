import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ReportButton({ kind, id }: { kind: "post" | "comment" | "opportunity"; id: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    if (reason.trim().length < 3) return toast.error("Conte brevemente o motivo.");
    setBusy(true);
    const { error } = await supabase.from("reports").insert({ reporter_id: user!.id, target_kind: kind, target_id: id, reason: reason.trim().slice(0, 500) });
    setBusy(false);
    if (error && !error.message.includes("duplicate")) return toast.error("Não foi possível enviar a denúncia.");
    toast.success("Denúncia enviada à moderação.");
    setOpen(false); setReason("");
  }
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-secondary" aria-label="Denunciar">
        <Flag className="h-4 w-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar conteúdo</DialogTitle>
            <DialogDescription>A equipe de moderação vai analisar. Quem publicou não verá quem denunciou.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Ex.: spam, ofensa, golpe, informação falsa…" />
          <Button onClick={send} disabled={busy}>{busy ? "Enviando…" : "Enviar denúncia"}</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
