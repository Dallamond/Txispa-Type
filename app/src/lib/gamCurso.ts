// Progreso de los cursos visto desde la gamificación. No tiene criterios propios: usa `progresoCurso`
// (hecha / dominada) y `leccionSuperada` (precisión >= 95 %), de modo que el XP y los logros
// coinciden siempre con lo que muestra la pantalla del curso. Todo se deriva de los intentos.
// Los módulos se identifican con su clave `curso/módulo` ("html/M01"): el mismo `M01` existe en cada curso.

import type { Intento } from "../types";
import { IDS_CURSOS, MODULOS, MODULOS_POR_CURSO, buscarLeccion, claveModulo, esModuloLibre, idLeccion, type CursoId } from "../data/curso";
import { leccionSuperada } from "./curso";
import { progresoCurso } from "./progresoCurso";

/** Módulos de la ruta de cada curso (sin los libres, como el diccionario): son los que cuentan como "módulo completado". */
const RUTA = MODULOS.filter((m) => !esModuloLibre(m));

const IDS_POR_MODULO: ReadonlyMap<string, readonly string[]> = new Map(
  MODULOS.map((m) => [claveModulo(m), m.lecciones.map((l) => idLeccion(m, l))])
);

/** Lecciones de un curso (para las metas de sus logros). */
export function totalLeccionesDeCurso(curso: CursoId): number {
  return MODULOS_POR_CURSO[curso].reduce((n, m) => n + m.lecciones.length, 0);
}

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

/** Ids de intento ("html/L01.01") de las lecciones de un módulo, dada su clave ("html/M01"). */
export function leccionesDeModulo(clave: string): readonly string[] {
  return IDS_POR_MODULO.get(clave) ?? [];
}

/** ¿Están superadas todas las lecciones de ese módulo de la ruta? (false si no existe o es libre) */
export function moduloCompleto(clave: string, estados: ReadonlyMap<string, EstadoGam>): boolean {
  if (!RUTA.some((m) => claveModulo(m) === clave)) return false;
  const ids = leccionesDeModulo(clave);
  return ids.length > 0 && ids.every((id) => (estados.get(id) ?? "pendiente") !== "pendiente");
}

/** Clave del módulo ("html/M01") al que pertenece una lección guardada en un intento, o null si ya no existe. */
export function moduloDeLeccion(leccionId: string): string | null {
  const encontrada = buscarLeccion(leccionId);
  return encontrada ? claveModulo(encontrada.modulo) : null;
}

export function leccionesSuperadas(intentos: readonly Intento[], curso?: CursoId): number {
  let n = 0;
  for (const [id, e] of estadosGam(intentos)) if (e !== "pendiente" && (!curso || id.startsWith(`${curso}/`))) n++;
  return n;
}

export function leccionesDominadas(intentos: readonly Intento[]): number {
  let n = 0;
  for (const e of estadosGam(intentos).values()) if (e === "dominada") n++;
  return n;
}

export function modulosCompletados(intentos: readonly Intento[]): number {
  const estados = estadosGam(intentos);
  return RUTA.filter((m) => moduloCompleto(claveModulo(m), estados)).length;
}

export { IDS_CURSOS };
