// XP y niveles. Todo se DERIVA de la lista de intentos (no se guarda nada):
// así se aplica a todo el historial, sobrevive a exportar/importar y, el día que haya
// cuenta en la nube, basta con que los intentos se sincronicen para que el XP coincida.
// La precisión manda: la velocidad sola no da XP extra (regla de calidad antes que velocidad).

import type { Intento } from "../types";
import { PRECISION_MINIMA } from "./medidas";

/** Caracteres correctos que dan 1 XP. */
export const CARACTERES_POR_XP = 10;
export const BONUS_RECORD = 50;
export const BONUS_LIMPIO = 20;
/** Caracteres correctos mínimos para que un intento "limpio" (0 errores) cuente como tal. */
export const MIN_CARACTERES_LIMPIO = 150;

export interface DesgloseXp {
  base: number;
  /** Multiplicador por precisión aplicado a la base. */
  multiplicador: number;
  bonusRecord: number;
  bonusLimpio: number;
  total: number;
}

/** Multiplicador por precisión: por debajo de 92 % medio, desde 98 % uno y medio. */
export function multiplicadorPrecision(acc: number): number {
  if (acc < 92) return 0.5;
  if (acc < PRECISION_MINIMA) return 0.8;
  if (acc < 98) return 1;
  return 1.5;
}

/** Mejor wpm de test con precisión digna en una lista, o null. */
export function mejorWpmDigno(intentos: readonly Intento[]): number | null {
  let mejor: number | null = null;
  for (const i of intentos) {
    if (i.modo !== "test" || i.acc < PRECISION_MINIMA) continue;
    if (mejor === null || i.wpm > mejor) mejor = i.wpm;
  }
  return mejor;
}

/** XP de un intento, dado lo anterior (para el bonus de récord). `previos` no incluye al intento. */
export function desgloseXp(intento: Intento, previos: readonly Intento[]): DesgloseXp {
  const multiplicador = multiplicadorPrecision(intento.acc);
  const base = Math.round((intento.correct / CARACTERES_POR_XP) * multiplicador);
  const mejor = mejorWpmDigno(previos);
  const esRecord = intento.modo === "test" && intento.acc >= PRECISION_MINIMA && mejor !== null && intento.wpm > mejor;
  const bonusRecord = esRecord ? BONUS_RECORD : 0;
  const bonusLimpio = intento.errors === 0 && intento.correct >= MIN_CARACTERES_LIMPIO ? BONUS_LIMPIO : 0;
  return { base, multiplicador, bonusRecord, bonusLimpio, total: base + bonusRecord + bonusLimpio };
}

function porFecha(intentos: readonly Intento[]): Intento[] {
  return [...intentos].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** XP total de todo el historial. */
export function xpTotal(intentos: readonly Intento[]): number {
  const orden = porFecha(intentos);
  let total = 0;
  for (let k = 0; k < orden.length; k++) total += desgloseXp(orden[k], orden.slice(0, k)).total;
  return total;
}

// ---------- Niveles ----------

/** XP acumulado necesario para ALCANZAR el nivel n (nivel 1 = 0 XP). */
export function xpParaNivel(n: number): number {
  if (n <= 1) return 0;
  return Math.round(100 * (n - 1) ** 1.5);
}

export const RANGOS = [
  { desde: 1, nombre: "Aprendiz" },
  { desde: 5, nombre: "Dedos ágiles" },
  { desde: 10, nombre: "Pulso firme" },
  { desde: 20, nombre: "Mecanógrafo" },
  { desde: 35, nombre: "Txispa" },
  { desde: 50, nombre: "Maestro del teclado" },
] as const;

export interface Nivel {
  nivel: number;
  rango: string;
  xp: number;
  /** XP dentro del nivel actual. */
  enNivel: number;
  /** XP que hay entre este nivel y el siguiente. */
  tramo: number;
  /** 0..1 */
  fraccion: number;
}

export function nivelDe(xp: number): Nivel {
  const x = Math.max(0, Math.floor(xp));
  let nivel = 1;
  while (xpParaNivel(nivel + 1) <= x) nivel++;
  const ini = xpParaNivel(nivel);
  const tramo = xpParaNivel(nivel + 1) - ini;
  const enNivel = x - ini;
  let rango: string = RANGOS[0].nombre;
  for (const r of RANGOS) if (nivel >= r.desde) rango = r.nombre;
  return { nivel, rango, xp: x, enNivel, tramo, fraccion: tramo > 0 ? enNivel / tramo : 0 };
}
