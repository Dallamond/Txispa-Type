// Logros derivados del historial (sin estado propio). Cada logro mide un `valor` y se
// desbloquea al llegar a su `meta`; los "nuevos" de un test son los que no estaban antes de él.

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
  /** Valor a alcanzar. */
  meta: number;
  /** Unidad para mostrar el progreso ("tests", "ppm"…). */
  unidad: string;
  /** Lo que llevas hacia la meta, según el historial completo. */
  valor: (intentos: readonly Intento[], ctx: ContextoLogros) => number;
}

const tests = (is: readonly Intento[]) => is.filter((i) => i.modo === "test");
/** Mejor wpm de un test con precisión digna. */
const mejorPpm = (is: readonly Intento[]) => tests(is).reduce((m, t) => (t.acc >= PRECISION_MINIMA && t.wpm > m ? t.wpm : m), 0);
const hito = (ppm: number, nombre: string, emoji: string): Logro => ({
  id: `ppm-${ppm}`,
  nombre,
  emoji,
  descripcion: `${ppm} ppm con al menos ${PRECISION_MINIMA} % de precisión.`,
  meta: ppm,
  unidad: "ppm",
  valor: mejorPpm,
});

export const LOGROS: readonly Logro[] = [
  { id: "primer-test", nombre: "Primer paso", descripcion: "Completa tu primer test.", emoji: "🎯", meta: 1, unidad: "tests", valor: (is) => tests(is).length },
  { id: "diez-tests", nombre: "Calentando motores", descripcion: "Completa 10 tests.", emoji: "🔟", meta: 10, unidad: "tests", valor: (is) => tests(is).length },
  { id: "cien-tests", nombre: "Constante", descripcion: "Completa 100 tests.", emoji: "💯", meta: 100, unidad: "tests", valor: (is) => tests(is).length },
  hito(40, "Caballo", "🐎"),
  hito(50, "Gacela", "🦌"),
  hito(55, "Objetivo a 30 días", "🏁"),
  hito(60, "Guepardo", "🐆"),
  hito(65, "Objetivo a 90 días", "🏆"),
  {
    id: "precision-98",
    nombre: "Cirujano",
    descripcion: "Un test de 1 minuto o más con 98 % de precisión o más.",
    emoji: "🩺",
    meta: 98,
    unidad: "% de precisión",
    valor: (is) => tests(is).reduce((m, t) => (t.durationSec >= 60 && t.acc > m ? t.acc : m), 0),
  },
  {
    id: "test-limpio",
    nombre: "Test limpio",
    descripcion: "Un test con 0 errores y al menos 150 caracteres correctos.",
    emoji: "✨",
    meta: 1,
    unidad: "test limpio",
    valor: (is) => (tests(is).some((t) => t.errors === 0 && t.correct >= 150) ? 1 : 0),
  },
  { id: "racha-3", nombre: "Tres seguidos", descripcion: "Racha de 3 días cumpliendo el objetivo.", emoji: "🔥", meta: 3, unidad: "días", valor: (is, c) => rachaMaxima(is, c) },
  { id: "racha-7", nombre: "Semana de fuego", descripcion: "Racha de 7 días cumpliendo el objetivo.", emoji: "☄️", meta: 7, unidad: "días", valor: (is, c) => rachaMaxima(is, c) },
  {
    id: "pulsaciones-10k",
    nombre: "Diez mil",
    descripcion: "10.000 pulsaciones acumuladas en tests y entrenos.",
    emoji: "⌨️",
    meta: 10_000,
    unidad: "pulsaciones",
    valor: (is) => is.reduce((n, i) => n + i.correct + i.errors, 0),
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

export interface EstadoLogro {
  logro: Logro;
  valor: number;
  /** 0..1 */
  fraccion: number;
  desbloqueado: boolean;
}

/** Estado de todos los logros, en el orden de `LOGROS`. */
export function estadoLogros(intentos: readonly Intento[], ctx: ContextoLogros): EstadoLogro[] {
  return LOGROS.map((logro) => {
    const valor = logro.valor(intentos, ctx);
    return { logro, valor, fraccion: Math.min(1, Math.max(0, valor / logro.meta)), desbloqueado: valor >= logro.meta };
  });
}

export function logrosDesbloqueados(intentos: readonly Intento[], ctx: ContextoLogros): Logro[] {
  return estadoLogros(intentos, ctx)
    .filter((e) => e.desbloqueado)
    .map((e) => e.logro);
}

/** Logros que `nuevo` desbloquea y que no estaban desbloqueados con `previos`. */
export function logrosNuevos(previos: readonly Intento[], nuevo: Intento, ctx: ContextoLogros): Logro[] {
  const antes = new Set(logrosDesbloqueados(previos, ctx).map((l) => l.id));
  return logrosDesbloqueados([...previos, nuevo], ctx).filter((l) => !antes.has(l.id));
}
