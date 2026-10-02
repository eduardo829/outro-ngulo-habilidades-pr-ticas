import ideia from "@/assets/photo-ideia.jpg";
import networking from "@/assets/photo-networking.jpg";
import vendas from "@/assets/photo-vendas.jpg";
import ia from "@/assets/photo-ia.jpg";
import hero from "@/assets/photo-hero.jpg";
import corretor from "@/assets/photo-corretor.jpg";
import kit from "@/assets/photo-c-kit.jpg";
import carreira from "@/assets/photo-c-carreira.jpg";
import transicao from "@/assets/photo-c-transicao.jpg";
import proximo from "@/assets/photo-c-proximo.jpg";
import entrevista from "@/assets/photo-c-entrevista.jpg";
import presenca from "@/assets/photo-c-presenca.jpg";
import comunicacao from "@/assets/photo-c-comunicacao.jpg";
import dinheiro from "@/assets/photo-c-dinheiro.jpg";

/** One unique cover photo per engine course (fallback: desk by the window). */
const COURSE_PHOTOS: Record<string, string> = {
  "da-ideia-aos-primeiros-clientes": ideia,
  "networking-do-zero": networking,
  "vendas-da-conversa-ao-cliente": vendas,
  "ia-no-trabalho": ia,
  "corretor-do-zero": corretor,
  "chegue-forte-ao-mercado": kit,
  "carreira-nao-emprego": carreira,
  "mudar-de-carreira": transicao,
  "o-proximo-passo": proximo,
  "entrevista-sem-resposta-decorada": entrevista,
  "linkedin-cv-e-presenca": presenca,
  "comunicacao-profissional": comunicacao,
  "dinheiro-sem-complicacao": dinheiro,
};

export const coursePhoto = (slug: string) => COURSE_PHOTOS[slug] ?? hero;
export { hero as heroPhoto };
