// Exportar e importar los datos en JSON:
// { app: "txispa-type", schema: 1, exportedAt, intentos, ajustes }.
// Al importar se fusiona por `id` (lo hace el RunStore) y se descartan los
// intentos con formato roto en vez de rechazar todo el archivo.

import type { Ajustes, Intento } from "../types";
import { normalizarAjustes } from "./ajustes";
import { SCHEMA } from "./almacen";
import { CURSOS } from "../data/curso/tipos";

export const APP_ID = "txispa-type";

/** Contadores que viven fuera de los intentos (localStorage) y que, sin esto, se perderían al cambiar de PC. */
export interface ContadoresExportados {
  calentamientoPuls: number;
  tiempoExtra: { dia: string; segundos: number } | null;
}

export interface Exportacion {
  app: typeof APP_ID;
  schema: number;
  exportedAt: string;
  intentos: Intento[];
  ajustes: Ajustes;
  /** Opcional: los archivos antiguos no lo traen. */
  contadores?: ContadoresExportados;
}

export function crearExportacion(intentos: readonly Intento[], ajustes: Ajustes, fecha: Date, contadores?: ContadoresExportados): Exportacion {
  return { app: APP_ID, schema: SCHEMA, exportedAt: fecha.toISOString(), intentos: [...intentos], ajustes, ...(contadores ? { contadores } : {}) };
}

export type ResultadoImportacion =
  | { ok: true; intentos: Intento[]; descartados: number; ajustes: Ajustes | null; contadores: ContadoresExportados | null }
  | { ok: false; error: string };

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const esNumero = (v: unknown) => typeof v === "number" && Number.isFinite(v);

/** Límite de claves por mapa: el teclado tiene unas 100; más es un archivo manipulado. */
const MAX_CLAVES = 200;

const esTecla = (v: unknown) => esObjeto(v) && esNumero(v.n) && esNumero(v.e) && esNumero(v.ms) && esNumero(v.msN);
const esPar = (v: unknown) => esObjeto(v) && esNumero(v.n) && esNumero(v.ms);
const mapaDe = (v: Record<string, unknown>, valido: (x: unknown) => boolean) => {
  const valores = Object.values(v);
  return valores.length <= MAX_CLAVES && valores.every(valido);
};

/** Identificador de lección del curso: "html/L01.01", "css/L06.R". */
export const PATRON_LECCION_ID = new RegExp(`^(${Object.keys(CURSOS).join("|")})/L\\d{2}\\.(\\d{2}|R|J)$`);

/** ¿Tiene un intento la forma mínima para no romper estadísticas ni almacén? */
export function esIntentoValido(v: unknown): v is Intento {
  if (!esObjeto(v)) return false;
  if (v.leccionId !== undefined && !(typeof v.leccionId === "string" && PATRON_LECCION_ID.test(v.leccionId))) return false;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.date === "string" &&
    !Number.isNaN(Date.parse(v.date)) &&
    typeof v.localDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.localDate) &&
    (v.modo === "test" || v.modo === "entreno") &&
    esNumero(v.durationSec) &&
    esNumero(v.wpm) &&
    esNumero(v.acc) &&
    esNumero(v.correct) &&
    esNumero(v.errors) &&
    esObjeto(v.teclas) &&
    mapaDe(v.teclas, esTecla) &&
    esObjeto(v.pares) &&
    mapaDe(v.pares, esPar) &&
    esObjeto(v.confusiones) &&
    mapaDe(v.confusiones, esNumero)
  );
}

/** Contadores de un archivo, o null si faltan o vienen rotos (nunca rechaza el archivo entero). */
function leerContadores(v: unknown): ContadoresExportados | null {
  if (!esObjeto(v) || !esNumero(v.calentamientoPuls) || (v.calentamientoPuls as number) < 0) return null;
  const t = v.tiempoExtra;
  const tiempoExtra =
    esObjeto(t) && typeof t.dia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.dia) && esNumero(t.segundos) && (t.segundos as number) > 0
      ? { dia: t.dia, segundos: Math.floor(t.segundos as number) }
      : null;
  return { calentamientoPuls: Math.floor(v.calentamientoPuls as number), tiempoExtra };
}

export function leerImportacion(texto: string): ResultadoImportacion {
  let crudo: unknown;
  try {
    crudo = JSON.parse(texto);
  } catch {
    return { ok: false, error: "El archivo no es un JSON válido." };
  }
  if (!esObjeto(crudo) || crudo.app !== APP_ID) {
    return { ok: false, error: "El archivo no es una exportación de Txispa Type." };
  }
  if (typeof crudo.schema !== "number" || crudo.schema > SCHEMA) {
    return { ok: false, error: "El archivo es de una versión más nueva de Txispa Type." };
  }
  if (!Array.isArray(crudo.intentos)) {
    return { ok: false, error: "El archivo no contiene intentos." };
  }
  const validos = crudo.intentos.filter(esIntentoValido);
  return {
    ok: true,
    intentos: validos,
    descartados: crudo.intentos.length - validos.length,
    ajustes: esObjeto(crudo.ajustes) ? normalizarAjustes(crudo.ajustes) : null,
    contadores: leerContadores(crudo.contadores),
  };
}

/** Nombre de archivo de la exportación: txispa-type-AAAA-MM-DD.json */
export function nombreArchivo(dia: string): string {
  return `txispa-type-${dia}.json`;
}
