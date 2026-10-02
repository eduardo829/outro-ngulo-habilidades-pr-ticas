import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { COURSES_ENGINE } from "@/lib/learning/courses";
import { useCourseVideos, type CourseVideo } from "@/lib/learning/store";
import { parseVideo, VIDEO_PROVIDERS } from "@/lib/video";
import { getGestor } from "@/lib/gestores";
import type { Course, Module } from "@/lib/learning/types";

export const Route = createFileRoute("/_authenticated/admin/videos")({
  head: () => ({ meta: [{ title: "Vídeos das aulas — Administração" }] }),
  component: AdminVideos,
});

function AdminVideos() {
  const [slug, setSlug] = useState(COURSES_ENGINE[0]!.slug);
  const c = COURSES_ENGINE.find((x) => x.slug === slug)!;
  const videos = useCourseVideos(slug);
  return (
    <div>
      <h2 className="text-xl font-bold">Vídeos das aulas</h2>
      <p className="mt-1 text-sm text-muted-foreground">Cole o link do YouTube ou Vimeo. Assim que o link for salvo, o aviso “Vídeo em preparação” será substituído pelo reprodutor de vídeo para os alunos.</p>
      <div className="mt-4 flex flex-wrap gap-2">{COURSES_ENGINE.map((x) => <Button key={x.slug} size="sm" variant={x.slug === slug ? "default" : "outline"} onClick={() => setSlug(x.slug)}>{x.title}</Button>)}</div>
      {videos.isLoading ? <p className="mt-6 text-muted-foreground">Carregando…</p> : (
        <ul className="mt-6 space-y-3">{c.modules.map((m, i) => <VideoRow key={`${slug}-${m.key}`} c={c} m={m} i={i} row={videos.data?.[m.key]} />)}</ul>
      )}
    </div>
  );
}

function VideoRow({ c, m, i, row }: { c: Course; m: Module; i: number; row?: CourseVideo | undefined }) {
  const qc = useQueryClient();
  const defTitle = m.blocks.find((b) => b.type === "video")?.title ?? m.title;
  const defGestor = c.gestor ? getGestor(c.gestor)?.name ?? "" : "";
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: row?.title ?? defTitle, gestor: row?.gestor ?? defGestor, provider: row?.provider ?? "youtube", video_url: row?.video_url ?? "",
    thumbnail_url: row?.thumbnail_url ?? "", duration_text: row?.duration_text ?? "", description: row?.description ?? "", transcript: row?.transcript ?? "", captions_url: row?.captions_url ?? "",
  });
  const valid = !f.video_url.trim() || !!parseVideo(f.provider, f.video_url);
  const save = useMutation({
    mutationFn: async () => {
      const nul = (s: string) => (s.trim() ? s.trim() : null);
      const { error } = await supabase.from("course_videos").upsert({
        course_slug: c.slug, module_key: m.key, title: nul(f.title), gestor: nul(f.gestor), provider: nul(f.video_url) ? f.provider : null, video_url: nul(f.video_url),
        thumbnail_url: nul(f.thumbnail_url), duration_text: nul(f.duration_text), description: nul(f.description), transcript: nul(f.transcript), captions_url: nul(f.captions_url), updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Vídeo salvo."); qc.invalidateQueries({ queryKey: ["course-videos", c.slug] }); },
    onError: () => toast.error("Não foi possível salvar."),
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <li className="border bg-card">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="w-6 text-xs font-bold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
        <span className="flex-1"><span className="font-semibold">{m.title}</span><span className="block text-sm text-muted-foreground">{row?.title ?? defTitle}</span></span>
        <span className="text-xs">{row?.video_url ? "Publicado" : "Em preparação"}</span>
      </button>
      {open && (
        <div className="grid gap-3 border-t p-4 md:grid-cols-2">
          <label className="text-sm">Título<Input value={f.title} onChange={set("title")} /></label>
          <label className="text-sm">Gestor<Input value={f.gestor} onChange={set("gestor")} /></label>
          <label className="text-sm">Provedor<select value={f.provider} onChange={set("provider")} className="mt-1 block w-full border bg-background px-2 py-2">{VIDEO_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
          <label className="text-sm">Link do vídeo<Input value={f.video_url} onChange={set("video_url")} placeholder="https://youtu.be/…" />{!valid && <span className="text-xs text-destructive">Link não reconhecido para este provedor.</span>}</label>
          <label className="text-sm">Miniatura (URL da imagem)<Input value={f.thumbnail_url} onChange={set("thumbnail_url")} /></label>
          <label className="text-sm">Duração<Input value={f.duration_text} onChange={set("duration_text")} placeholder="Ex.: 12 min" /></label>
          <label className="text-sm md:col-span-2">Descrição<Textarea value={f.description} onChange={set("description")} rows={2} /></label>
          <label className="text-sm md:col-span-2">Transcrição<Textarea value={f.transcript} onChange={set("transcript")} rows={4} /></label>
          <label className="text-sm md:col-span-2">Legendas (URL)<Input value={f.captions_url} onChange={set("captions_url")} /></label>
          <div className="md:col-span-2"><Button size="sm" disabled={!valid || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Salvando…" : "Salvar"}</Button></div>
        </div>
      )}
    </li>
  );
}
