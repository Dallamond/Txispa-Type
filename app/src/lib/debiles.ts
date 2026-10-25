// Teclas y pares débiles. Fórmulas de docs/ESPECIFICACION-TECNICA.md §3.
//
// Ventana: los últimos 30 intentos (test y entreno). Para que un entreno lento
// no distorsione la latencia, la de cada tecla se normaliza por intento:
//   latRel = (ms/msN de la tecla en ese intento) / (intervalo medio del intento)
// y se agrega ponderando por el número de intervalos.

import type { Intento } from "../types";
import { CHARMAP } from "../data/keyboard";
import { SEMILLAS_ERROR, SEMILLA_HASTA, SEMILLA_PULSACIONES } from "../data/semillas";
import { ESPACIO } from "./agregados";

export const VENTANA_INTENTOS = 30;
export const MIN_PULSACIONES = 20;
export const MIN_INTERVALOS = 10;
export const PESO_ERRORES = 10;
export const PESO_LENTITUD = 1.5;
export const UMBRAL_DEBIL = 0.15;
export const MAX_TECLAS_DEBILES = 8;
export const MIN_REPETICIONES_PAR = 6;
export const UMBRAL_PAR_LENTO = 1.25;
export const MAX_PARES_LENTOS = 10;

export interface TeclaEvaluada {
  /** Carácter en minúscula; el espacio es "␣". */
  tecla: string;
  n: number;
  e: number;
  errRate: number;
  /** Latencia relativa a la media (1 = como el resto), o null si hay pocos intervalos. */
  latRel: number | null;
  puntuacion: number;
  /** Los datos incluyen la semilla de typing.com (aún hay pocas pulsaciones propias). */
  semilla: boolean;
}

export interface ParLento {
  par: string;
  n: number;
  /** Media en ms de las veces que se tecleó. */
  ms: number;
  latRel: number;
}

export interface Analisis {
  /** Todas las teclas evaluables, de mayor a menor puntuación. */
  teclas: TeclaEvaluada[];
  /** Las que superan el umbral, como máximo `MAX_TECLAS_DEBILES`. */
  debiles: TeclaEvaluada[];
  /** Los pares más lentos, como máximo `MAX_PARES_LENTOS`. */
  pares: ParLento[];
  intentosUsados: number;
}

/** Intervalo medio (ms) de un intento, o null si no hay intervalos. */
function intervaloMedio(i: Intento): number | null {
  let ms = 0;
  let n = 0;
  for (const t of Object.values(i.teclas)) {
    ms += t.ms;
    n += t.msN;
  }
  return n > 0 ? ms / n : null;
}

export function puntuacionDe(errRate: number, latRel: number | null): number {
  const lenta = latRel === null ? 0 : Math.max(0, latRel - 1);
  return PESO_ERRORES * errRate + PESO_LENTITUD * lenta;
}

export function analizar(
  intentos: readonly Intento[],
  opciones: { ventana?: number; semillas?: boolean } = {}
): Analisis {
  const ventana = opciones.ventana ?? VENTANA_INTENTOS;
  const usarSemillas = opciones.semillas ?? true;
  const usados = [...intentos].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-ventana);

  const acum = new Map<string, { n: number; e: number; msN: number; relSuma: number; sembrada: boolean }>();
  const acumPares = new Map<string, { n: number; ms: number; relSuma: number }>();

  for (const intento of usados) {
    const media = intervaloMedio(intento);
    for (const [tecla, s] of Object.entries(intento.teclas)) {
      const a = acum.get(tecla) ?? { n: 0, e: 0, msN: 0, relSuma: 0, sembrada: false };
      a.n += s.n;
      a.e += s.e;
      if (media !== null && s.msN > 0) {
        a.msN += s.msN;
        a.relSuma += (s.ms / s.msN / media) * s.msN;
      }
      acum.set(tecla, a);
    }
    if (media !== null) {
      for (const [par, p] of Object.entries(intento.pares)) {
        if (p.n <= 0) continue;
        const a = acumPares.get(par) ?? { n: 0, ms: 0, relSuma: 0 };
        a.n += p.n;
        a.ms += p.ms;
        a.relSuma += (p.ms / p.n / media) * p.n;
        acumPares.set(par, a);
      }
    }
  }

  // Semillas: mientras una tecla tenga pocas pulsaciones propias se suma una semilla.
  if (usarSemillas) {
    for (const [tecla, tasa] of Object.entries(SEMILLAS_ERROR)) {
      const a = acum.get(tecla) ?? { n: 0, e: 0, msN: 0, relSuma: 0, sembrada: false };
      if (a.n < SEMILLA_HASTA) {
        a.n += SEMILLA_PULSACIONES;
        a.e += SEMILLA_PULSACIONES * tasa;
        a.sembrada = true;
        acum.set(tecla, a);
      }
    }
  }

  const teclas: TeclaEvaluada[] = [];
  for (const [tecla, a] of acum) {
    if (a.n < MIN_PULSACIONES) continue;
    const latRel = a.msN >= MIN_INTERVALOS ? a.relSuma / a.msN : null;
    // Sin intervalos suficientes solo se evalúa una tecla con semilla (por errores).
    if (latRel === null && !a.sembrada) continue;
    const errRate = a.e / a.n;
    teclas.push({ tecla, n: a.n, e: a.e, errRate, latRel, puntuacion: puntuacionDe(errRate, latRel), semilla: a.sembrada });
  }
  teclas.sort((x, y) => y.puntuacion - x.puntuacion);

  const pares: ParLento[] = [];
  for (const [par, a] of acumPares) {
    if (a.n < MIN_REPETICIONES_PAR) continue;
    const latRel = a.relSuma / a.n;
    if (latRel >= UMBRAL_PAR_LENTO) pares.push({ par, n: a.n, ms: a.ms / a.n, latRel });
  }
  pares.sort((x, y) => y.latRel - x.latRel);

  return {
    teclas,
    debiles: teclas.filter((t) => t.puntuacion >= UMBRAL_DEBIL).slice(0, MAX_TECLAS_DEBILES),
    pares: pares.slice(0, MAX_PARES_LENTOS),
    intentosUsados: usados.length,
  };
}

/** Id de la tecla física de un carácter ("á" → "a", "␣" → "Space"). */
export function idTecla(tecla: string): string | null {
  if (tecla === ESPACIO) return "Space";
  return CHARMAP[tecla]?.key ?? null;
}

/** Mapa de calor para el teclado: id de tecla → 0..1. Solo teclas evaluadas. */
export function calorDeTeclas(analisis: Analisis, techo = 1.2): Record<string, number> {
  const calor: Record<string, number> = {};
  for (const t of analisis.teclas) {
    const id = idTecla(t.tecla);
    if (!id) continue;
    calor[id] = Math.max(calor[id] ?? 0, Math.min(1, t.puntuacion / techo));
  }
  return calor;
}
