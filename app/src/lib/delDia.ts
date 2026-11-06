// Comparación de un test con el resto de tests del mismo día.

import type { Intento } from "../types";

export interface ComparacionDelDia {
  /** Tests del día en orden cronológico, incluido el actual. */
  tests: Intento[];
  /** Posición del actual dentro de `tests`. */
  indice: number;
  /** 1 = el más rápido del día. */
  puesto: number;
  total: number;
  mejor: number;
  media: number;
  /** Media de los OTROS tests del día, o null si no hay. */
  mediaOtros: number | null;
  esMejor: boolean;
}

/** null si el intento no es un test. Los demás tests se toman de `intentos` (el actual se añade si falta). */
export function comparacionDelDia(intentos: readonly Intento[], actual: Intento): ComparacionDelDia | null {
  if (actual.modo !== "test") return null;
  const otros = intentos.filter((i) => i.modo === "test" && i.localDate === actual.localDate && i.id !== actual.id);
  const tests = [...otros, actual].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const indice = tests.findIndex((t) => t.id === actual.id);
  const puesto = 1 + tests.filter((t) => t.id !== actual.id && t.wpm > actual.wpm).length;
  const mejor = Math.max(...tests.map((t) => t.wpm));
  const media = tests.reduce((s, t) => s + t.wpm, 0) / tests.length;
  const mediaOtros = otros.length === 0 ? null : otros.reduce((s, t) => s + t.wpm, 0) / otros.length;
  return { tests, indice, puesto, total: tests.length, mejor, media, mediaOtros, esMejor: puesto === 1 && tests.length > 1 };
}
