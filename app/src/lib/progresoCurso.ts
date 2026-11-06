// Progreso del curso, derivado de los intentos guardados (no hay almacén propio).
// Criterios de docs/curso/SPEC-FORMATO-LECCIONES.md §6. Son valores semilla, no verdades sobre Lucas.

import type { Intento } from "../types";
import { idLeccion, type Leccion, type Modulo } from "../data/curso";
import { leccionSuperada } from "./curso";

export type EstadoLeccion = "bloqueada" | "disponible" | "hecha" | "dominada";

/** Con esta precisión y la velocidad de su dificultad, una sola vez basta para dominar la lección. */
export const PRECISION_DOMINADA = 98;
/** Velocidad (ppm) que acompaña a la precisión anterior, según la dificultad de 1 a 5. Semilla. */
export const PPM_DOMINADA = [8, 10, 12, 14, 16] as const;
/** Superar la lección en este número de días distintos también la domina. */
export const DIAS_DOMINADA = 3;

export interface OpcionesProgreso {
  /** Salta el orden: todas las lecciones quedan disponibles. */
  desbloquearTodo?: boolean;
  /** Módulos fuera de la ruta (diccionario): están abiertos desde el principio y no desbloquean a otros. */
  libres?: readonly string[];
}

/** Intentos del curso que superan su lección, agrupados por `leccionId`. */
function superadosPorLeccion(intentos: readonly Intento[]): Map<string, Intento[]> {
  const mapa = new Map<string, Intento[]>();
  for (const i of intentos) {
    if (i.fuente !== "curso" || !i.leccionId || !leccionSuperada(i)) continue;
    const lista = mapa.get(i.leccionId);
    if (lista) lista.push(i);
    else mapa.set(i.leccionId, [i]);
  }
  return mapa;
}

function esDominada(superados: readonly Intento[], leccion: Leccion): boolean {
  const ppm = PPM_DOMINADA[leccion.dificultad - 1];
  if (new Set(superados.map((i) => i.localDate)).size >= DIAS_DOMINADA) return true;
  return superados.some((i) => i.acc >= PRECISION_DOMINADA && i.wpm >= ppm);
}

/** Estado de cada lección, por su `leccionId` ("html/L01.01").
 * Una lección se abre al estar hecha la anterior del módulo; el primer elemento de un módulo,
 * al estar hecho el repaso del módulo anterior de la ruta. Lo ya hecho se queda hecho aunque
 * el orden lo bloquease. */
export function progresoCurso(
  intentos: readonly Intento[],
  modulos: readonly Modulo[],
  opciones: OpcionesProgreso = {}
): Map<string, EstadoLeccion> {
  const { desbloquearTodo = false, libres = [] } = opciones;
  const superados = superadosPorLeccion(intentos);
  const estados = new Map<string, EstadoLeccion>();
  let rutaAbierta = true;

  for (const modulo of modulos) {
    const libre = libres.includes(modulo.id);
    const moduloAbierto: boolean = desbloquearTodo || libre || rutaAbierta;
    let anteriorHecha: boolean = moduloAbierto;
    for (const leccion of modulo.lecciones) {
      const id = idLeccion(modulo, leccion);
      const propios = superados.get(id);
      let estado: EstadoLeccion;
      if (propios) estado = esDominada(propios, leccion) ? "dominada" : "hecha";
      else estado = anteriorHecha ? "disponible" : "bloqueada";
      estados.set(id, estado);
      anteriorHecha = desbloquearTodo || estado === "hecha" || estado === "dominada";
    }
    if (!libre) rutaAbierta = anteriorHecha; // el repaso es el último elemento del módulo
  }
  return estados;
}

export interface ResumenLeccion {
  /** Intentos guardados de la lección (superados o no). */
  intentos: number;
  /** Mejor velocidad entre los intentos superados (la precisión manda), o null si no hay. */
  mejorPpm: number | null;
  /** Mejor precisión de todos los intentos, o null si no hay. */
  mejorPrecision: number | null;
}

/** Intentos y mejores marcas de cada lección, por `leccionId`. */
export function resumenesDeLecciones(intentos: readonly Intento[]): Map<string, ResumenLeccion> {
  const mapa = new Map<string, ResumenLeccion>();
  for (const i of intentos) {
    if (i.fuente !== "curso" || !i.leccionId) continue;
    const r = mapa.get(i.leccionId) ?? { intentos: 0, mejorPpm: null, mejorPrecision: null };
    r.intentos += 1;
    if (r.mejorPrecision === null || i.acc > r.mejorPrecision) r.mejorPrecision = i.acc;
    if (leccionSuperada(i) && (r.mejorPpm === null || i.wpm > r.mejorPpm)) r.mejorPpm = i.wpm;
    mapa.set(i.leccionId, r);
  }
  return mapa;
}

/** La primera lección disponible de la ruta (para "Continuar donde lo dejé"), o null si no queda ninguna. */
export function siguienteDisponible(
  modulos: readonly Modulo[],
  estados: ReadonlyMap<string, EstadoLeccion>,
  libres: readonly string[] = []
): { modulo: Modulo; leccion: Leccion } | null {
  for (const modulo of modulos) {
    if (libres.includes(modulo.id)) continue;
    for (const leccion of modulo.lecciones) {
      if (estados.get(idLeccion(modulo, leccion)) === "disponible") return { modulo, leccion };
    }
  }
  return null;
}

/** La lección que sigue a esta: la siguiente del módulo o, al acabarlo, la primera del siguiente módulo
 * de la ruta. Los módulos libres (diccionario) no continúan en otro. Null si no hay más. */
export function siguienteLeccion(
  modulos: readonly Modulo[],
  modulo: Modulo,
  leccion: Leccion,
  libres: readonly string[] = []
): { modulo: Modulo; leccion: Leccion } | null {
  const i = modulo.lecciones.indexOf(leccion);
  if (i >= 0 && i < modulo.lecciones.length - 1) return { modulo, leccion: modulo.lecciones[i + 1] };
  if (libres.includes(modulo.id)) return null;
  const ruta = modulos.filter((m) => !libres.includes(m.id));
  const j = ruta.indexOf(modulo);
  const siguiente = j >= 0 ? ruta[j + 1] : undefined;
  return siguiente ? { modulo: siguiente, leccion: siguiente.lecciones[0] } : null;
}

/** Cuántas lecciones del módulo están hechas (o dominadas) y cuántas tiene. */
export function avanceDeModulo(modulo: Modulo, estados: ReadonlyMap<string, EstadoLeccion>): { hechas: number; total: number } {
  const hechas = modulo.lecciones.filter((l) => {
    const e = estados.get(idLeccion(modulo, l));
    return e === "hecha" || e === "dominada";
  }).length;
  return { hechas, total: modulo.lecciones.length };
}
