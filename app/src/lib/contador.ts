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
