// Calentamientos: datos y generadores puros. No se guardan ni cuentan para
// ninguna estadística. Ver docs/ESPECIFICACION-TECNICA.md §5.

import { mulberry32 } from "./rng";
import type { Analisis } from "./debiles";
import { palabrasAlternancia, palabrasDebiles, palabrasDelBanco } from "./textos";

/** Duraciones del calentamiento que se pueden elegir (minutos). */
export const DURACIONES_CALENTAMIENTO = [2, 3, 5, 8, 10] as const;
export type MinutosCalentamiento = (typeof DURACIONES_CALENTAMIENTO)[number];

/** wpm usado para el cursor fantasma si aún no hay tests. */
export const WPM_INICIAL = 46;
/** El calentamiento va a un ritmo suave: este porcentaje de tu media. */
export const RITMO_CALENTAMIENTO = 0.7;

const FILA_BASE = "asdfjklñ";

/** Palabras de la fila base (3 a 5 letras, sin repetir letra seguida). Determinista por semilla. */
export function palabrasFilaBase(seed: number, n: number): string[] {
  const rng = mulberry32(seed);
  const palabras: string[] = [];
  for (let i = 0; i < n; i++) {
    const largo = 3 + Math.floor(rng() * 3);
    let w = "";
    for (let k = 0; k < largo; k++) {
      let c = FILA_BASE[Math.floor(rng() * FILA_BASE.length)];
      if (k > 0 && c === w[k - 1]) c = FILA_BASE[(FILA_BASE.indexOf(c) + 1) % FILA_BASE.length];
      w += c;
    }
    palabras.push(w);
  }
  return palabras;
}

/** Cuántas palabras hacen falta para no quedarse sin texto antes de acabar el tiempo. */
export function palabrasParaCalentar(segundos: number, wpmMedio: number | null): number {
  return Math.ceil((segundos / 60) * (wpmMedio ?? WPM_INICIAL) * 1.2) + 20;
}

/**
 * Texto de un calentamiento tecleado, de menos a más exigente: fila base,
 * alternancia de manos, tus pares débiles (o alternancia si aún no hay datos)
 * y texto corrido. Todo en una sola tirada, sin pausas. Determinista por semilla.
 */
export function textoCalentamiento(
  segundos: number,
  seed: number,
  opciones: { puntuacion: boolean; analisis?: Analisis; wpmMedio: number | null }
): string[] {
  const total = palabrasParaCalentar(segundos, opciones.wpmMedio);
  const parte = (f: number) => Math.max(10, Math.round(total * f));
  const sinPuntuacion = { puntuacion: false };
  const pares =
    opciones.analisis && opciones.analisis.pares.length > 0
      ? palabrasDebiles(seed + 2, opciones.analisis, { ...sinPuntuacion, minPalabras: parte(0.25) }, true)
      : palabrasAlternancia(seed + 2, { ...sinPuntuacion, minPalabras: parte(0.25) });
  return [
    ...palabrasFilaBase(seed, parte(0.15)),
    ...palabrasAlternancia(seed + 1, { ...sinPuntuacion, minPalabras: parte(0.25) }),
    ...pares,
    ...palabrasDelBanco(seed + 3, { puntuacion: opciones.puntuacion, minPalabras: parte(0.35) }),
  ];
}

/** wpm al que avanza el cursor fantasma del calentamiento. */
export function wpmFantasmaCalentamiento(wpmMedio: number | null): number {
  return (wpmMedio ?? WPM_INICIAL) * RITMO_CALENTAMIENTO;
}

/** Pulso inicial del metrónomo (wpm): el 70% de tu media, o de 46 si aún no hay datos. */
export function pulsoInicial(wpmMedio: number | null): number {
  return Math.round((wpmMedio ?? WPM_INICIAL) * 0.7);
}

/** Posición (índice de carácter en el texto con espacios) del cursor fantasma. */
export function posicionFantasma(wpm: number, segundos: number): number {
  return Math.floor((wpm * 5 * segundos) / 60);
}

/** Convierte una posición en el texto corrido en (palabra, letra). Si cae en un
 * espacio se asigna a la última letra de la palabra anterior. */
export function ubicarEnPalabras(palabras: readonly string[], pos: number): { palabra: number; letra: number } | null {
  if (palabras.length === 0 || pos < 0) return null;
  let resto = pos;
  for (let i = 0; i < palabras.length; i++) {
    const largo = palabras[i].length;
    if (resto < largo) return { palabra: i, letra: resto };
    if (resto === largo) return { palabra: i, letra: Math.max(0, largo - 1) };
    resto -= largo + 1;
  }
  return null;
}
