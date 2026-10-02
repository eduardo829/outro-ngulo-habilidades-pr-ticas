import ideia from "@/assets/photo-ideia.jpg";
import networking from "@/assets/photo-networking.jpg";
import vendas from "@/assets/photo-vendas.jpg";
import ia from "@/assets/photo-ia.jpg";
import hero from "@/assets/photo-hero.jpg";

/** Cinematic cover photo per engine course (fallback: desk by the window). */
const COURSE_PHOTOS: Record<string, string> = {
  "da-ideia-aos-primeiros-clientes": ideia,
  "networking-do-zero": networking,
  "vendas-da-conversa-ao-cliente": vendas,
  "ia-no-trabalho": ia,
};

export const coursePhoto = (slug: string) => COURSE_PHOTOS[slug] ?? hero;
export { hero as heroPhoto };
