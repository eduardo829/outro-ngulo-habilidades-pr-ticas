// Accepted video providers. Never accept raw HTML — only IDs / URLs we parse.
export const VIDEO_PROVIDERS = [
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
] as const;

export function parseVideo(provider: string | null, ref: string | null): string | null {
  if (!provider || !ref) return null;
  const v = ref.trim();
  if (provider === "youtube") {
    const m =
      v.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/) ??
      v.match(/^([\w-]{11})$/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&cc_load_policy=1` : null;
  }
  if (provider === "vimeo") {
    const m = v.match(/vimeo\.com\/(?:video\/)?(\d+)/) ?? v.match(/^(\d+)$/);
    return m ? `https://player.vimeo.com/video/${m[1]}?dnt=1` : null;
  }
  return null;
}
