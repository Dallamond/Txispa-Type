// Progreso del curso visto desde la gamificación. No tiene criterios propios: usa `progresoCurso`
// (hecha / dominada) y `leccionSuperada` (precisión >= 95 %), de modo que el XP y los logros
// coinciden siempre con lo que muestra la pantalla del curso. Todo se deriva de los intentos.

import type { Intento } from "../types";
import { buscarLeccion, idLeccion, LECCIONES, MODULOS, MODULOS_LIBRES } from "../data/curso";
import { leccionSuperada } from "./curso";
import { progresoCurso } from "./progresoCurso";

/** Módulos de la ruta del curso (sin los libres, como el diccionario): son los que cuentan como "módulo completado". */
const RUTA = MODULOS.filter((m) => !MODULOS_LIBRES.includes(m.id));

/** Lecciones y módulos que hay en total (para las metas de los logros). */
export const TOTAL_LECCIONES = LECCIONES.length;
export const TOTAL_MODULOS = RUTA.length;

const IDS_POR_MODULO: ReadonlyMap<string, readonly string[]> = new Map(
  MODULOS.map((m) => [m.id, m.lecciones.map((l) => idLeccion(m, l))])
);

/** ¿El intento es una lección del curso superada? */
export function esLeccionSuperada(i: Intento): boolean {
  return i.fuente === "curso" && !!i.leccionId && leccionSuperada(i);
}

export type EstadoGam = "pendiente" | "superada" | "dominada";

/** Estado de cada lección según el historial, por `leccionId` ("html/L01.01"). Las no hechas son "pendiente". */
export function estadosGam(intentos: readonly Intento[]): Map<string, EstadoGam> {
  const estados = progresoCurso(intentos, MODULOS, { desbloquearTodo: true });
  const salida = new Map<string, EstadoGam>();
  for (const [id, e] of estados) salida.set(id, e === "dominada" ? "dominada" : e === "hecha" ? "superada" : "pendiente");
  return salida;
}

/** Ids de intento ("html/L01.01") de las lecciones de un módulo. */
export function leccionesDeModulo(moduloId: string): readonly string[] {
  return IDS_POR_MODULO.get(moduloId) ?? [];
}

/** ¿Están superadas todas las lecciones de ese módulo de la ruta? (false si no existe o es libre) */
export function moduloCompleto(moduloId: string, estados: ReadonlyMap<string, EstadoGam>): boolean {
  if (MODULOS_LIBRES.includes(moduloId)) return false;
  const ids = leccionesDeModulo(moduloId);
  return ids.length > 0 && ids.every((id) => (estados.get(id) ?? "pendiente") !== "pendiente");
}

/** Módulo al que pertenece una lección guardada en un intento, o null si ya no existe. */
export function moduloDeLeccion(leccionId: string): string | null {
  return buscarLeccion(leccionId)?.modulo.id ?? null;
}

export function leccionesSuperadas(intentos: readonly Intento[]): number {
  let n = 0;
  for (const e of estadosGam(intentos).values()) if (e !== "pendiente") n++;
  return n;
}

export function leccionesDominadas(intentos: readonly Intento[]): number {
  let n = 0;
  for (const e of estadosGam(intentos).values()) if (e === "dominada") n++;
  return n;
}

export function modulosCompletados(intentos: readonly Intento[]): number {
  const estados = estadosGam(intentos);
  return RUTA.filter((m) => moduloCompleto(m.id, estados)).length;
}
