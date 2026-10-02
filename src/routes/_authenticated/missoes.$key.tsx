import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { findMission } from "@/lib/angulo";
import { COURSES_ENGINE } from "@/lib/learning/courses";

export const Route = createFileRoute("/_authenticated/missoes/$key")({
  loader: ({ params }) => { const m = findMission(params.key); if (!m) throw notFound(); return { title: m.title }; },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title ?? "Missão"} — Outro Ângulo` }, { name: "description", content: "Missão prática da Outro Ângulo." }] }),
  notFoundComponent: () => <p className="p-10">Missão não encontrada. <Link to="/missoes" className="underline">Ver missões</Link></p>,
  component: Page,
});

function Page() {
  const { key } = Route.useParams();
  const m = findMission(key)!;
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["mission", user?.id, key], enabled: !!user, queryFn: async () => (await supabase.from("mission_progress").select("*").eq("user_id", user!.id).eq("mission_key", key).maybeSingle()).data });
  const [ev, setEv] = useState(""); const [refl, setRefl] = useState("");
  useEffect(() => { if (q.data) { setEv(((q.data.answers as Record<string, string>)?.["evidence"]) ?? ""); setRefl(q.data.reflection ?? ""); } }, [q.data]);
  const course = COURSES_ENGINE.find((c) => c.slug === m.course);
  async function save(complete: boolean | null) {
    const completed_at = complete === null ? (q.data?.completed_at ?? null) : complete ? new Date().toISOString() : null;
    const { error } = await supabase.from("mission_progress").upsert({ user_id: user!.id, mission_key: key, answers: { evidence: ev }, reflection: refl || null, completed_at, updated_at: new Date().toISOString() });
    if (error) return toast.error("Não foi possível salvar.");
    qc.invalidateQueries({ queryKey: ["mission"] }); qc.invalidateQueries({ queryKey: ["missions"] });
    toast.success(complete ? "Missão concluída. Ela já aparece nas suas evidências." : "Salvo.");
  }
  const done = !!q.data?.completed_at;
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8">
      <Link to="/missoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Missões</Link>
      <p className="eyebrow mt-6">Missão · {m.area}</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">{m.title}</h1>
      <p className="mt-4 border-l-2 border-highlight pl-4 text-lg">{m.why}</p>
      <dl className="mt-6 grid gap-px border bg-border text-sm sm:grid-cols-2">
        <div className="bg-background p-4"><dt className="eyebrow">Esforço estimado</dt><dd className="mt-1">{m.effort}</dd></div>
        <div className="bg-background p-4"><dt className="eyebrow">Evidência</dt><dd className="mt-1">{m.evidence}</dd></div>
      </dl>
      <h2 className="mt-10 font-display text-xl font-extrabold">O que fazer</h2>
      <ol className="mt-3 space-y-3">{m.steps.map((s, i) => <li key={i} className="grid grid-cols-[2rem_1fr] gap-2"><span className="font-display font-extrabold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span><span>{s}</span></li>)}</ol>
      {m.questions && (<><h2 className="mt-8 font-display text-xl font-extrabold">Perguntas para usar</h2><ul className="mt-3 list-disc space-y-1 pl-5">{m.questions.map((x) => <li key={x}>{x}</li>)}</ul></>)}
      {course && <p className="mt-6 text-sm">Relacionada ao curso <Link to="/cursos/$slug" params={{ slug: course.slug }} className="font-semibold underline">{course.title}</Link>.</p>}
      <div className="mt-10 border-t pt-8">
        <label className="block"><span className="font-semibold">Registro: {m.evidence}</span><Textarea className="mt-2" rows={4} maxLength={4000} value={ev} onChange={(e) => setEv(e.target.value)} /></label>
        <label className="mt-5 block"><span className="font-display text-lg font-extrabold">{m.reflection}</span><Textarea className="mt-2" rows={4} maxLength={6000} value={refl} onChange={(e) => setRefl(e.target.value)} /></label>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => save(null)}>Salvar</Button>
          {done ? <Button variant="ghost" onClick={() => save(false)}>Desfazer conclusão</Button>
            : <Button onClick={() => save(true)} disabled={refl.trim().length < 10}><Check />Concluir missão</Button>}
        </div>
        {done && <p className="mt-3 text-sm text-primary">Concluída. Aparece em Meu Ângulo, em Evidências.</p>}
        {!done && <p className="mt-2 text-xs text-muted-foreground">Para concluir, escreva o que você descobriu. Só você vê.</p>}
      </div>
    </div>
  );
}
