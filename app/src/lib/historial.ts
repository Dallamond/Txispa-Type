// Filtrado, ordenación y formato del historial (pantalla Estadísticas). Funciones puras.
import type { Intento } from "../types";
import { PRECISION_MINIMA } from "./medidas";

export type FiltroDuracion = "todas" | number;
export type FiltroModo = "test" | "entreno" | "todos";
export type CampoOrden = "fecha" | "velocidad" | "precision";
export type Direccion = "asc" | "desc";


export function filtrarPorDuracion<T extends Intento>(intentos: readonly T[], duracion: FiltroDuracion): T[] {
  return duracion === "todas" ? [...intentos] : intentos.filter((i) => i.durationSec === duracion);
}

export function filtrarPorModo<T extends Intento>(intentos: readonly T[], modo: FiltroModo): T[] {
  return modo === "todos" ? [...intentos] : intentos.filter((i) => i.modo === modo);
}

const porFecha = (a: Intento, b: Intento) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

/** Ordena sin mutar. Los empates se desempatan por fecha (más reciente primero en "desc"). */
export function ordenarHistorial(intentos: readonly Intento[], campo: CampoOrden, dir: Direccion): Intento[] {
  const valor = (i: Intento) => (campo === "velocidad" ? i.wpm : campo === "precision" ? i.acc : 0);
  const signo = dir === "asc" ? 1 : -1;
  return [...intentos].sort((a, b) => {
    const d = campo === "fecha" ? porFecha(a, b) : valor(a) - valor(b);
    return d !== 0 ? signo * d : signo * porFecha(a, b);
  });
}

/** Últimos `n` tests (solo modo test, filtrados por duración), de más antiguo a más reciente. */
export function serieParaGrafica(intentos: readonly Intento[], duracion: FiltroDuracion, n = 60): Intento[] {
  const tests = filtrarPorDuracion(filtrarPorModo(intentos, "test"), duracion).sort(porFecha);
  return tests.slice(-n);
}

/** Media móvil de ventana `ventana` (con menos puntos al principio). */
export function mediaMovil(vals: readonly number[], ventana = 5): number[] {
  return vals.map((_, i) => {
    const tramo = vals.slice(Math.max(0, i - ventana + 1), i + 1);
    return tramo.reduce((s, v) => s + v, 0) / tramo.length;
  });
}

export const precisionBaja = (acc: number): boolean => acc < PRECISION_MINIMA;

/** Número con coma decimal. */
export function formatoNumero(n: number, decimales = 1): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

/** "2026-10-25" -> "25/10/2026". */
export function formatoDia(dia: string): string {
  const [a, m, d] = dia.split("-");
  return `${d}/${m}/${a}`;
}

/** "25/10" para las etiquetas del eje. */
export function formatoDiaCorto(dia: string): string {
  const [, m, d] = dia.split("-");
  return `${d}/${m}`;
}

/** Hora local de Madrid "HH:MM" de una fecha ISO. */
export function formatoHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Variación con signo y coma: "+4,2 %". */
export function formatoVariacion(pct: number): string {
  const s = formatoNumero(Math.abs(pct), 1);
  return `${pct > 0 ? "+" : pct < 0 ? "−" : ""}${s} %`;
}

export function etiquetaDuracion(s: number): string {
  return s < 60 || s % 60 !== 0 ? `${s} s` : `${s / 60} min`;
}

/** Marcas del eje Y en valores redondos (1, 2, 5 × 10^k) dentro de [lo, hi]: el paso
 * más pequeño que deja como mucho 6 marcas. */
export function ticksRedondos(lo: number, hi: number): number[] {
  const rango = hi - lo;
  if (!(rango > 0)) return [lo];
  const e0 = Math.floor(Math.log10(rango)) - 2;
  const pasos: number[] = [];
  for (let e = e0; e <= e0 + 4; e++) for (const m of [1, 2, 5]) pasos.push(m * 10 ** e);
  const cuenta = (p: number) => Math.floor(hi / p + 1e-9) - Math.ceil(lo / p - 1e-9) + 1;
  const paso = pasos.find((p) => cuenta(p) <= 6) ?? pasos[pasos.length - 1];
  const out: number[] = [];
  for (let k = Math.ceil(lo / paso - 1e-9); k * paso <= hi + paso * 1e-9; k++) out.push(Math.round(k * paso * 1e6) / 1e6 + 0);
  return out;
}
