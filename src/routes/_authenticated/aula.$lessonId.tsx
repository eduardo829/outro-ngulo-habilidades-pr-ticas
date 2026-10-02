import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check, Undo2, VideoOff, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { parseVideo } from "@/lib/video";
import { fetchCourseStructure } from "@/lib/course-structure";
import { LessonList } from "@/components/LessonList";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/aula/$lessonId")({
  head: () => ({ meta: [{ title: "Aula — Outro Ângulo" }, { name: "description", content: "Aula do curso." }] }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["lesson", lessonId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      // RLS only returns the lesson to enrolled students, previews, or admins.
      const { data: lesson } = await supabase.from("lessons").select("*, courses(id, slug, title)").eq("id", lessonId).maybeSingle();
      if (!lesson) return null;
      const structure = await fetchCourseStructure(lesson.course_id, user!.id);
      return { lesson, ...structure };
    },
  });

  useEffect(() => {
    if (q.data?.enrolled) supabase.rpc("touch_last_lesson", { _lesson: lessonId });
  }, [lessonId, q.data?.enrolled]);

  if (q.isLoading) return <p className="p-8 text-muted-foreground">Carregando aula…</p>;
  if (!q.data)
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <h1 className="mt-3 text-xl font-bold">Aula indisponível</h1>
        <p className="mt-2 text-muted-foreground">Esta aula exige matrícula ativa no curso ou ainda não foi publicada.</p>
        <Button asChild className="mt-5"><Link to="/meus-cursos">Meus cursos</Link></Button>
      </div>
    );

  const { lesson, modules, lessons, completed, enrolled } = q.data;
  const idx = lessons.findIndex((l) => l.lesson_id === lessonId);
  const prev = lessons[idx - 1];
  const next = lessons[idx + 1];
  const isDone = completed.has(lessonId);
  const embed = parseVideo(lesson.video_provider, lesson.video_ref);

  async function toggleDone() {
    if (isDone) {
      const { error } = await supabase.from("lesson_progress").delete().eq("user_id", user!.id).eq("lesson_id", lessonId);
      if (error) return toast.error("Não foi possível desfazer.");
    } else {
      const { error } = await supabase.from("lesson_progress").insert({ user_id: user!.id, lesson_id: lessonId, course_id: lesson.course_id });
      if (error) return toast.error("Não foi possível salvar.");
      toast.success("Aula concluída");
    }
    qc.invalidateQueries({ queryKey: ["lesson"] });
    qc.invalidateQueries({ queryKey: ["my-courses"] });
  }

  return (
    <div className="lg:grid lg:grid-cols-[1fr_320px]">
      <div>
        <div className="bg-ink px-0 py-0 md:px-8 md:py-8">
          <div className="mx-auto max-w-4xl">
            {embed ? (
              <div className="aspect-video w-full overflow-hidden md:rounded-lg">
                <iframe
                  src={embed}
                  title={lesson.title}
                  className="h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 text-ink-foreground/70 md:rounded-lg md:border md:border-ink-foreground/10">
                <VideoOff className="h-10 w-10" aria-hidden />
                <p>O vídeo desta aula ainda não foi adicionado.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-4xl space-y-8 px-5 py-6 md:px-8">
          <div>
            <Link to="/curso/$slug" params={{ slug: lesson.courses!.slug }} className="text-sm text-primary hover:underline">{lesson.courses!.title}</Link>
            <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{lesson.title}</h1>
            {lesson.duration_text && <p className="text-sm text-muted-foreground">{lesson.duration_text}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {enrolled && (
              <Button onClick={toggleDone} variant={isDone ? "outline" : "default"}>
                {isDone ? <><Undo2 /> Desfazer conclusão</> : <><Check /> Marcar como concluída</>}
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              {prev && <Button asChild variant="outline" size="sm"><Link to="/aula/$lessonId" params={{ lessonId: prev.lesson_id }}><ChevronLeft /> Anterior</Link></Button>}
              {next && <Button asChild variant="outline" size="sm"><Link to="/aula/$lessonId" params={{ lessonId: next.lesson_id }}>Próxima <ChevronRight /></Link></Button>}
            </div>
          </div>

          {lesson.summary && <p className="text-lg text-muted-foreground">{lesson.summary}</p>}
          {lesson.body && <div className="whitespace-pre-line leading-relaxed">{lesson.body}</div>}

          {lesson.exercise && (
            <section className="frame-offset rounded-lg border bg-card p-5">
              <h2 className="text-lg font-bold">Exercício prático</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{lesson.exercise}</p>
              {enrolled && <ExerciseAnswer lessonId={lessonId} userId={user!.id} />}
            </section>
          )}

          {enrolled && <Notes lessonId={lessonId} userId={user!.id} />}
        </div>
      </div>

      <aside className="border-t bg-card p-5 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-l lg:border-t-0">
        <h2 className="mb-4 font-display font-bold">Conteúdo do curso</h2>
        <LessonList modules={modules} lessons={lessons} completed={completed} enrolled={enrolled} currentId={lessonId} />
      </aside>
    </div>
  );
}

function useAutosave(save: (v: string) => Promise<boolean>, value: string, ready: boolean) {
  const [status, setStatus] = useState<"" | "saving" | "saved" | "error">("");
  const first = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (first.current) { first.current = false; return; }
    setStatus("saving");
    const t = setTimeout(async () => setStatus((await save(value)) ? "saved" : "error"), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ready]);
  return status;
}

function Notes({ lessonId, userId }: { lessonId: string; userId: string }) {
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    supabase.from("lesson_notes").select("content").eq("lesson_id", lessonId).eq("user_id", userId).maybeSingle()
      .then(({ data }) => { setText(data?.content ?? ""); setReady(true); });
  }, [lessonId, userId]);
  const status = useAutosave(async (v) => {
    const { error } = await supabase.from("lesson_notes").upsert({ user_id: userId, lesson_id: lessonId, content: v, updated_at: new Date().toISOString() });
    return !error;
  }, text, ready);
  return (
    <section>
      <div className="flex items-center justify-between">
        <Label htmlFor="notes" className="text-lg font-bold">Minhas anotações</Label>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {status === "saving" ? "Salvando…" : status === "saved" ? "Salvo" : status === "error" ? "Erro ao salvar" : "Só você vê"}
        </span>
      </div>
      <Textarea id="notes" className="mt-2 min-h-32" value={text} disabled={!ready} onChange={(e) => setText(e.target.value)} placeholder="Escreva o que quiser lembrar desta aula." />
    </section>
  );
}

function ExerciseAnswer({ lessonId, userId }: { lessonId: string; userId: string }) {
  const [text, setText] = useState("");
  const [doneEx, setDoneEx] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    supabase.from("exercise_answers").select("answer, completed").eq("lesson_id", lessonId).eq("user_id", userId).maybeSingle()
      .then(({ data }) => { setText(data?.answer ?? ""); setDoneEx(!!data?.completed); setReady(true); });
  }, [lessonId, userId]);
  const save = async (answer: string, completed = doneEx) => {
    const { error } = await supabase.from("exercise_answers").upsert({ user_id: userId, lesson_id: lessonId, answer, completed, updated_at: new Date().toISOString() });
    return !error;
  };
  const status = useAutosave((v) => save(v), text, ready);
  return (
    <div className="mt-4 space-y-3">
      <Label htmlFor="ex">Sua resposta (privada)</Label>
      <Textarea id="ex" value={text} disabled={!ready} onChange={(e) => setText(e.target.value)} />
      <div className="flex items-center gap-2">
        <Checkbox id="exdone" checked={doneEx} disabled={!ready} onCheckedChange={async (c) => { setDoneEx(!!c); await save(text, !!c); }} />
        <Label htmlFor="exdone">Concluí esta atividade</Label>
        <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">{status === "saving" ? "Salvando…" : status === "saved" ? "Salvo" : status === "error" ? "Erro ao salvar" : ""}</span>
      </div>
    </div>
  );
}
