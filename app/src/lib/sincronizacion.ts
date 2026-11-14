// Sincronización con la nube: tipos y lógica pura. No importa Firebase (eso vive solo en
// `remotoFirestore.ts`), así que se prueba con un remoto simulado en memoria.
//
// Reglas (docs/PLAN_INTEGRACION_FIREBASE.md): IndexedDB manda; la nube es transporte entre dispositivos.
// Los intentos son inmutables con UUID, así que sincronizar es la unión de conjuntos por `id`.

import type { Intento } from "../types";
import type { AlmacenClaveValor } from "./ajustes";

/** Estado que enseña el indicador de la cabecera. */
export type EstadoSync =
  | { tipo: "local" } // sin sesión o nube no configurada
  | { tipo: "sincronizando" }
  | { tipo: "sincronizado"; pendientes: 0 }
  | { tipo: "sin-conexion"; pendientes: number }
  | { tipo: "error"; mensaje: string; pendientes: number }
  | { tipo: "cuenta-distinta" }; // en este navegador había datos de otra cuenta: hay que elegir

/** Lo que la capa de sincronización necesita de la nube. La implementa `remotoFirestore.ts`. */
export interface Remoto {
  /** Intentos con `syncedAt` posterior al cursor (null = todos) y el cursor nuevo (el mayor `syncedAt` visto). */
  bajar(cursor: number | null): Promise<{ intentos: Intento[]; cursor: number | null }>;
  /** Sube intentos nuevos. Un id que ya existe en la nube cuenta como subido (los intentos no se modifican). Lanza si falla la red. */
  subir(intentos: readonly Intento[]): Promise<void>;
  /** Contador que sube cada vez que alguien pulsa "Borrar todo". */
  epoch(): Promise<number>;
  /** Borra todos los intentos de la nube y sube el contador. Devuelve el contador nuevo. */
  borrarTodo(): Promise<number>;
}

/** Lo que se recuerda de la nube en este navegador (clave `txispatype.sync.v1`). */
export interface DatosSync {
  /** Cuenta con la que se sincronizó por última vez; null = nunca. */
  uid: string | null;
  /** Mayor `syncedAt` descargado (milisegundos), o null si aún no se ha descargado nada. */
  cursor: number | null;
  /** Último `epoch` de borrado visto; null = ninguno. */
  epochVisto: number | null;
  /** Ids de intentos guardados aquí que aún no están en la nube. */
  pendientes: string[];
}

export const CLAVE_SYNC = "txispatype.sync.v1";
/** Tamaño máximo de un lote de escritura de Firestore. */
export const LOTE = 500;

export const datosVacios = (): DatosSync => ({ uid: null, cursor: null, epochVisto: null, pendientes: [] });

export function leerDatosSync(almacen: AlmacenClaveValor | null): DatosSync {
  if (!almacen) return datosVacios();
  try {
    const v = JSON.parse(almacen.getItem(CLAVE_SYNC) ?? "null") as Partial<DatosSync> | null;
    if (!v || typeof v !== "object") return datosVacios();
    return {
      uid: typeof v.uid === "string" ? v.uid : null,
      cursor: typeof v.cursor === "number" && Number.isFinite(v.cursor) ? v.cursor : null,
      epochVisto: typeof v.epochVisto === "number" && Number.isFinite(v.epochVisto) ? v.epochVisto : null,
      pendientes: Array.isArray(v.pendientes) ? v.pendientes.filter((x): x is string => typeof x === "string") : [],
    };
  } catch {
    return datosVacios();
  }
}

export function guardarDatosSync(almacen: AlmacenClaveValor | null, datos: DatosSync): void {
  if (!almacen) return;
  try {
    almacen.setItem(CLAVE_SYNC, JSON.stringify(datos));
  } catch {
    // Almacenamiento lleno o bloqueado: la sincronización se rehace con una comparación de ids al volver a conectar.
  }
}

/** Parte una lista en lotes de como mucho `n` elementos. */
export function trocear<T>(lista: readonly T[], n: number = LOTE): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < lista.length; i += n) lotes.push(lista.slice(i, i + n));
  return lotes;
}

/** Ids que hay en local y no en la nube: lo que hay que subir en la primera sincronización de una cuenta. */
export function faltanEnNube(locales: readonly Intento[], idsRemotos: ReadonlySet<string>): string[] {
  return locales.filter((i) => !idsRemotos.has(i.id)).map((i) => i.id);
}

/** Une dos listas de ids sin repetir, conservando el orden. */
export function unirIds(a: readonly string[], b: readonly string[]): string[] {
  return [...new Set([...a, ...b])];
}

/** Lo que se guarda en la nube de un intento: el intento sin campos `undefined` (Firestore los rechaza). */
export function paraNube(intento: Intento): Record<string, unknown> {
  return JSON.parse(JSON.stringify(intento)) as Record<string, unknown>;
}
