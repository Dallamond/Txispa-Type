// Exportar e importar los datos en JSON:
// { app: "txispa-type", schema: 1, exportedAt, intentos, ajustes }.
// Al importar se fusiona por `id` (lo hace el RunStore) y se descartan los
// intentos con formato roto en vez de rechazar todo el archivo.

import type { Ajustes, Intento } from "../types";
import { normalizarAjustes } from "./ajustes";
import { SCHEMA } from "./almacen";

export const APP_ID = "txispa-type";

export interface Exportacion {
  app: typeof APP_ID;
  schema: number;
  exportedAt: string;
  intentos: Intento[];
  ajustes: Ajustes;
}

export function crearExportacion(intentos: readonly Intento[], ajustes: Ajustes, fecha: Date): Exportacion {
  return { app: APP_ID, schema: SCHEMA, exportedAt: fecha.toISOString(), intentos: [...intentos], ajustes };
}

export type ResultadoImportacion =
  | { ok: true; intentos: Intento[]; descartados: number; ajustes: Ajustes | null }
  | { ok: false; error: string };

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const esNumero = (v: unknown) => typeof v === "number" && Number.isFinite(v);

/** ¿Tiene un intento la forma mínima para no romper estadísticas ni almacén? */
export function esIntentoValido(v: unknown): v is Intento {
  if (!esObjeto(v)) return false;
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
    esObjeto(v.pares) &&
    esObjeto(v.confusiones)
  );
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
  };
}

/** Nombre de archivo de la exportación: txispa-type-AAAA-MM-DD.json */
export function nombreArchivo(dia: string): string {
  return `txispa-type-${dia}.json`;
}
