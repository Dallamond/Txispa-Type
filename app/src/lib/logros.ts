// Logros derivados del historial (sin estado propio). Un logro está desbloqueado si el
// historial cumple su condición; los "nuevos" de un test son los que no estaban antes de él.

import type { Intento } from "../types";
import { racha } from "./estadisticas";
import { PRECISION_MINIMA } from "./medidas";

export interface ContextoLogros {
  /** Tests por día que dan el objetivo diario por cumplido (para la racha). */
  objetivoTests: number;
}

export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  /** Desbloqueado según el historial completo. */
  cumple: (intentos: readonly Intento[], ctx: ContextoLogros) => boolean;
}

const tests = (is: readonly Intento[]) => is.filter((i) => i.modo === "test");
const hito = (ppm: number) => (is: readonly Intento[]) => tests(is).some((t) => t.wpm >= ppm && t.acc >= PRECISION_MINIMA);

export const LOGROS: readonly Logro[] = [
  { id: "primer-test", nombre: "Primer paso", descripcion: "Completa tu primer test.", emoji: "🎯", cumple: (is) => tests(is).length >= 1 },
  { id: "diez-tests", nombre: "Calentando motores", descripcion: "Completa 10 tests.", emoji: "🔟", cumple: (is) => tests(is).length >= 10 },
  { id: "cien-tests", nombre: "Constante", descripcion: "Completa 100 tests.", emoji: "💯", cumple: (is) => tests(is).length >= 100 },
  { id: "ppm-40", nombre: "Caballo", descripcion: "40 ppm con al menos 95 % de precisión.", emoji: "🐎", cumple: hito(40) },
  { id: "ppm-50", nombre: "Gacela", descripcion: "50 ppm con al menos 95 % de precisión.", emoji: "🦌", cumple: hito(50) },
  { id: "ppm-55", nombre: "Objetivo a 30 días", descripcion: "55 ppm con al menos 95 % de precisión.", emoji: "🏁", cumple: hito(55) },
  { id: "ppm-60", nombre: "Guepardo", descripcion: "60 ppm con al menos 95 % de precisión.", emoji: "🐆", cumple: hito(60) },
  { id: "ppm-65", nombre: "Objetivo a 90 días", descripcion: "65 ppm con al menos 95 % de precisión.", emoji: "🏆", cumple: hito(65) },
  {
    id: "precision-98",
    nombre: "Cirujano",
    descripcion: "Un test de 1 minuto o más con 98 % de precisión o más.",
    emoji: "🎯",
    cumple: (is) => tests(is).some((t) => t.durationSec >= 60 && t.acc >= 98),
  },
  {
    id: "test-limpio",
    nombre: "Test limpio",
    descripcion: "Un test con 0 errores y al menos 150 caracteres correctos.",
    emoji: "✨",
    cumple: (is) => tests(is).some((t) => t.errors === 0 && t.correct >= 150),
  },
  { id: "racha-3", nombre: "Tres seguidos", descripcion: "Racha de 3 días cumpliendo el objetivo.", emoji: "🔥", cumple: (is, c) => rachaMaxima(is, c) >= 3 },
  { id: "racha-7", nombre: "Semana de fuego", descripcion: "Racha de 7 días cumpliendo el objetivo.", emoji: "🔥", cumple: (is, c) => rachaMaxima(is, c) >= 7 },
  {
    id: "pulsaciones-10k",
    nombre: "Diez mil",
    descripcion: "10.000 pulsaciones acumuladas en tests y entrenos.",
    emoji: "⌨️",
    cumple: (is) => is.reduce((n, i) => n + i.correct + i.errors, 0) >= 10_000,
  },
];

/** Racha más larga alcanzada alguna vez (se evalúa en cada día con actividad). */
export function rachaMaxima(intentos: readonly Intento[], ctx: ContextoLogros): number {
  const lista = [...intentos];
  const dias = [...new Set(lista.map((i) => i.localDate))];
  let max = 0;
  for (const d of dias) max = Math.max(max, racha(lista, d, ctx.objetivoTests));
  return max;
}

export function logrosDesbloqueados(intentos: readonly Intento[], ctx: ContextoLogros): Logro[] {
  return LOGROS.filter((l) => l.cumple(intentos, ctx));
}

/** Logros que `nuevo` desbloquea y que no estaban desbloqueados con `previos`. */
export function logrosNuevos(previos: readonly Intento[], nuevo: Intento, ctx: ContextoLogros): Logro[] {
  const antes = new Set(logrosDesbloqueados(previos, ctx).map((l) => l.id));
  return logrosDesbloqueados([...previos, nuevo], ctx).filter((l) => !antes.has(l.id));
}
