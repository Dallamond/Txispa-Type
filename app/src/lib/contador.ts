// Contador de pulsaciones de los calentamientos. Los tests y entrenos ya están en
// los intentos guardados; los calentamientos no se guardan, así que su total se
// acumula aparte (solo un número, nunca lo tecleado). Clave propia `txispatype.`.

import type { AlmacenClaveValor } from "./ajustes";

export const CLAVE_CALENTAMIENTO = "txispatype.calentamiento.v1";

export function leerPulsacionesCalentamiento(almacen: AlmacenClaveValor | null): number {
  if (!almacen) return 0;
  try {
    const n = Number(JSON.parse(almacen.getItem(CLAVE_CALENTAMIENTO) ?? "0"));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

/** Suma `n` pulsaciones al total de calentamientos y devuelve el nuevo total. */
export function sumarPulsacionesCalentamiento(almacen: AlmacenClaveValor | null, n: number): number {
  const total = leerPulsacionesCalentamiento(almacen) + Math.max(0, Math.floor(n));
  if (!almacen) return total;
  try {
    almacen.setItem(CLAVE_CALENTAMIENTO, JSON.stringify(total));
  } catch {
    // Almacenamiento lleno o bloqueado: el total de esta sesión sigue vivo.
  }
  return total;
}

// Tiempo de práctica vivido en sesiones que no acabaron (test abandonado, pestaña
// cerrada). Los intentos guardados ya cuentan su tiempo; esto solo cubre lo demás
// del día, para que cada segundo tecleado sume aunque el test no se complete.

export const CLAVE_TIEMPO_EXTRA = "txispatype.tiempoextra.v1";

interface TiempoExtra {
  dia: string;
  segundos: number;
}

function leerCrudo(almacen: AlmacenClaveValor | null): TiempoExtra {
  if (!almacen) return { dia: "", segundos: 0 };
  try {
    const v = JSON.parse(almacen.getItem(CLAVE_TIEMPO_EXTRA) ?? "null") as TiempoExtra | null;
    if (!v || typeof v.dia !== "string" || !Number.isFinite(v.segundos) || v.segundos <= 0) return { dia: "", segundos: 0 };
    return { dia: v.dia, segundos: Math.floor(v.segundos) };
  } catch {
    return { dia: "", segundos: 0 };
  }
}

/** Segundos extra del día `hoy`. Si lo guardado es de otro día, no cuenta (se reinicia). */
export function leerTiempoExtra(almacen: AlmacenClaveValor | null, hoy: string): number {
  const v = leerCrudo(almacen);
  return v.dia === hoy ? v.segundos : 0;
}

/** Suma segundos extra del día y devuelve el total del día (reinicio si cambia el día). */
export function sumarTiempoExtra(almacen: AlmacenClaveValor | null, hoy: string, segundos: number): number {
  const v = leerCrudo(almacen);
  const base = v.dia === hoy ? v.segundos : 0;
  const total = base + Math.max(0, Math.floor(segundos));
  if (!almacen) return total;
  try {
    almacen.setItem(CLAVE_TIEMPO_EXTRA, JSON.stringify({ dia: hoy, segundos: total } satisfies TiempoExtra));
  } catch {
    // Almacenamiento lleno o bloqueado: el tiempo de esta sesión sigue contando en vivo.
  }
  return total;
}
