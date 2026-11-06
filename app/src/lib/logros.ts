// Logros por familias con niveles (bronce → diamante), derivados del historial: no hay
// estado propio. Cada familia mide un `valor` y sube de nivel al superar cada meta.
// Los "nuevos" de un test son los niveles que ese test hace alcanzar por primera vez.

import type { Intento } from "../types";
import { racha } from "./estadisticas";
import { PRECISION_MINIMA } from "./medidas";

export type Tier = "bronce" | "plata" | "oro" | "platino" | "diamante";

export const TIERS: readonly { id: Tier; nombre: string; emoji: string }[] = [
  { id: "bronce", nombre: "Bronce", emoji: "🥉" },
  { id: "plata", nombre: "Plata", emoji: "🥈" },
  { id: "oro", nombre: "Oro", emoji: "🥇" },
  { id: "platino", nombre: "Platino", emoji: "💠" },
  { id: "diamante", nombre: "Diamante", emoji: "💎" },
];

export interface ContextoLogros {
  /** Tests por día que dan el objetivo diario por cumplido (para la racha). */
  objetivoTests: number;
}

export interface NivelLogro {
  tier: Tier;
  meta: number;
}

export interface Logro {
  id: string;
  nombre: string;
  emoji: string;
  /** Texto de lo que hay que hacer para una meta concreta. */
  descripcion: (meta: number) => string;
  /** Unidad para mostrar el progreso ("tests", "ppm"…). */
  unidad: string;
  /** Metas de menor a mayor; se asignan a los tiers en orden (bronce, plata, oro…). */
  metas: readonly number[];
  /** Lo que llevas hacia la meta, según el historial completo. */
  valor: (intentos: readonly Intento[], ctx: ContextoLogros) => number;
}

const es = (n: number) => n.toLocaleString("es-ES");
const tests = (is: readonly Intento[]) => is.filter((i) => i.modo === "test");
const porFecha = (is: readonly Intento[]) => [...is].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

/** Racha más larga alcanzada alguna vez (se evalúa en cada día con actividad). */
export function rachaMaxima(intentos: readonly Intento[], ctx: ContextoLogros): number {
  const lista = [...intentos];
  const dias = [...new Set(lista.map((i) => i.localDate))];
  let max = 0;
  for (const d of dias) max = Math.max(max, racha(lista, d, ctx.objetivoTests));
  return max;
}

/** Mayor número de tests seguidos con precisión digna. */
export function mejorSeriePrecisa(intentos: readonly Intento[]): number {
  let max = 0;
  let actual = 0;
  for (const t of porFecha(tests(intentos))) {
    actual = t.acc >= PRECISION_MINIMA ? actual + 1 : 0;
    max = Math.max(max, actual);
  }
  return max;
}

export const LOGROS: readonly Logro[] = [
  {
    id: "velocidad",
    nombre: "Velocista",
    emoji: "🐆",
    descripcion: (m) => `Alcanza ${m} ppm con al menos ${PRECISION_MINIMA} % de precisión.`,
    unidad: "ppm",
    metas: [35, 45, 55, 65, 75],
    valor: (is) => tests(is).reduce((m, t) => (t.acc >= PRECISION_MINIMA && t.wpm > m ? t.wpm : m), 0),
  },
  {
    id: "precision",
    nombre: "Cirujano",
    emoji: "🩺",
    descripcion: (m) => `Un test de 1 minuto o más con ${m} % de precisión o más.`,
    unidad: "% de precisión",
    metas: [95, 97, 98, 99, 100],
    valor: (is) => tests(is).reduce((m, t) => (t.durationSec >= 60 && t.acc > m ? t.acc : m), 0),
  },
  {
    id: "impecable",
    nombre: "Impecable",
    emoji: "🛡️",
    descripcion: (m) => `${m} tests seguidos con ${PRECISION_MINIMA} % de precisión o más.`,
    unidad: "tests seguidos",
    metas: [3, 5, 10, 20, 50],
    valor: (is) => mejorSeriePrecisa(is),
  },
  {
    id: "limpios",
    nombre: "Test limpio",
    emoji: "✨",
    descripcion: (m) => `${m} ${m === 1 ? "test" : "tests"} con 0 errores y al menos 150 caracteres correctos.`,
    unidad: "tests limpios",
    metas: [1, 5, 15, 40, 100],
    valor: (is) => tests(is).filter((t) => t.errors === 0 && t.correct >= 150).length,
  },
  {
    id: "ritmo",
    nombre: "Metrónomo humano",
    emoji: "🎼",
    descripcion: (m) => `Un test con ritmo constante del ${m} % o más.`,
    unidad: "% de ritmo",
    metas: [60, 70, 80, 90],
    valor: (is) => tests(is).reduce((m, t) => (t.consistency !== null && t.consistency > m ? t.consistency : m), 0),
  },
  {
    id: "tests",
    nombre: "Constante",
    emoji: "💯",
    descripcion: (m) => `Completa ${es(m)} tests.`,
    unidad: "tests",
    metas: [10, 50, 100, 250, 500],
    valor: (is) => tests(is).length,
  },
  {
    id: "entrenos",
    nombre: "Entrenador",
    emoji: "🏋️",
    descripcion: (m) => `Completa ${es(m)} entrenos.`,
    unidad: "entrenos",
    metas: [5, 25, 75, 150, 300],
    valor: (is) => is.filter((i) => i.modo === "entreno").length,
  },
  {
    id: "racha",
    nombre: "Racha de fuego",
    emoji: "🔥",
    descripcion: (m) => `${m} días seguidos cumpliendo el objetivo diario.`,
    unidad: "días",
    metas: [3, 7, 14, 30, 60],
    valor: (is, c) => rachaMaxima(is, c),
  },
  {
    id: "dias",
    nombre: "Presente",
    emoji: "📅",
    descripcion: (m) => `Practica en ${m} días distintos.`,
    unidad: "días",
    metas: [5, 20, 50, 100, 200],
    valor: (is) => new Set(is.map((i) => i.localDate)).size,
  },
  {
    id: "tiempo",
    nombre: "Maratón",
    emoji: "⏱️",
    descripcion: (m) => `${m} ${m === 1 ? "hora" : "horas"} de práctica acumulada.`,
    unidad: "horas",
    metas: [1, 5, 15, 40, 100],
    valor: (is) => is.reduce((s, i) => s + i.elapsedSec, 0) / 3600,
  },
  {
    id: "pulsaciones",
    nombre: "Pulsador",
    emoji: "⌨️",
    descripcion: (m) => `${es(m)} pulsaciones acumuladas en tests y entrenos.`,
    unidad: "pulsaciones",
    metas: [5_000, 25_000, 100_000, 250_000, 1_000_000],
    valor: (is) => is.reduce((n, i) => n + i.correct + i.errors, 0),
  },
];

/** Niveles de una familia, con su tier asignado por orden. */
export function nivelesDe(logro: Logro): NivelLogro[] {
  return logro.metas.map((meta, i) => ({ tier: TIERS[i].id, meta }));
}

export interface EstadoLogro {
  logro: Logro;
  valor: number;
  /** Niveles alcanzados (0 = ninguno). */
  alcanzados: number;
  /** Mejor nivel alcanzado, o null. */
  actual: NivelLogro | null;
  /** Siguiente nivel, o null si ya está completo. */
  siguiente: NivelLogro | null;
  /** 0..1 desde la meta anterior hasta la siguiente (1 si está completo). */
  fraccion: number;
  completo: boolean;
}

export function estadoDe(logro: Logro, intentos: readonly Intento[], ctx: ContextoLogros): EstadoLogro {
  const valor = logro.valor(intentos, ctx);
  const niveles = nivelesDe(logro);
  const alcanzados = niveles.filter((n) => valor >= n.meta).length;
  const actual = alcanzados > 0 ? niveles[alcanzados - 1] : null;
  const siguiente = niveles[alcanzados] ?? null;
  const base = actual?.meta ?? 0;
  const fraccion = siguiente ? Math.min(1, Math.max(0, (valor - base) / (siguiente.meta - base))) : 1;
  return { logro, valor, alcanzados, actual, siguiente, fraccion, completo: siguiente === null };
}

/** Estado de todas las familias, en el orden de `LOGROS`. */
export function estadoLogros(intentos: readonly Intento[], ctx: ContextoLogros): EstadoLogro[] {
  return LOGROS.map((l) => estadoDe(l, intentos, ctx));
}

export interface LogroNuevo {
  logro: Logro;
  nivel: NivelLogro;
}

/** Niveles que `nuevo` hace alcanzar y que no estaban con `previos` (el mejor por familia). */
export function logrosNuevos(previos: readonly Intento[], nuevo: Intento, ctx: ContextoLogros): LogroNuevo[] {
  const salida: LogroNuevo[] = [];
  const todos = [...previos, nuevo];
  for (const l of LOGROS) {
    const antes = estadoDe(l, previos, ctx).alcanzados;
    const despues = estadoDe(l, todos, ctx);
    if (despues.alcanzados > antes && despues.actual) salida.push({ logro: l, nivel: despues.actual });
  }
  return salida;
}
