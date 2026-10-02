import type { Category, Course } from "./types";
import { DA_IDEIA } from "./da-ideia";
import { NETWORKING } from "./networking";
import { VENDAS } from "./vendas";
import { IA_TRABALHO } from "./ia";

export const COURSES_ENGINE: Course[] = [DA_IDEIA, NETWORKING, VENDAS, IA_TRABALHO];
export const getEngineCourse = (slug: string) => COURSES_ENGINE.find((c) => c.slug === slug);
export const CATEGORIES: ("Todos" | Category)[] = ["Todos", "Negócios", "Vendas", "Networking", "Tecnologia & IA", "Dinheiro", "Carreira"];
