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

/** Contadores actuales, para la exportación. */
export function leerContadores(almacen: AlmacenClaveValor | null, hoy: string): { calentamientoPuls: number; tiempoExtra: { dia: string; segundos: number } | null } {
  const v = leerCrudo(almacen);
  return { calentamientoPuls: leerPulsacionesCalentamiento(almacen), tiempoExtra: v.dia === hoy && v.segundos > 0 ? { dia: v.dia, segundos: v.segundos } : null };
}

/** Restaura contadores importados sin duplicar: gana el mayor de lo local y lo importado, así importar dos veces no suma dos. */
export function restaurarContadores(almacen: AlmacenClaveValor | null, importados: { calentamientoPuls: number; tiempoExtra: { dia: string; segundos: number } | null }): void {
  if (!almacen) return;
  try {
    if (importados.calentamientoPuls > leerPulsacionesCalentamiento(almacen)) {
      almacen.setItem(CLAVE_CALENTAMIENTO, JSON.stringify(importados.calentamientoPuls));
    }
    const t = importados.tiempoExtra;
    if (t) {
      const actual = leerCrudo(almacen);
      if (actual.dia !== t.dia || t.segundos > actual.segundos) {
        if (actual.dia <= t.dia) almacen.setItem(CLAVE_TIEMPO_EXTRA, JSON.stringify({ dia: t.dia, segundos: t.segundos } satisfies TiempoExtra));
      }
    }
  } catch {
    // Almacenamiento lleno o bloqueado: los intentos importados no dependen de esto.
  }
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
