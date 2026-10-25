// Generación de texto. Todo es determinista a partir de `seed` (mulberry32)
// para poder repetir un texto exacto. Fuente `banco`; las demás llegan en la fase 3.

import { TEXTOS } from "../data/textos";
import { barajado, mulberry32 } from "./rng";

/** 700 palabras: 5 minutos a ~100 ppm son 500, así que nunca se acaba a mitad. */
export const PALABRAS_MINIMAS = 700;

/** Quita puntuación y pasa a minúsculas (opción "puntuación y mayúsculas" apagada). */
export function simplificarPalabra(palabra: string): string {
  return palabra.replace(/[.,;:¿?¡!()"']/g, "").replace(/^-+|-+$/g, "").toLowerCase();
}

export interface OpcionesTexto {
  /** Con puntuación y mayúsculas tal cual están en el banco; sin ella, solo minúsculas. */
  puntuacion: boolean;
  minPalabras?: number;
}

/** Palabras del banco en orden determinista, al menos `minPalabras`.
 * Los párrafos se concatenan: el texto fluye sin saltos de línea. */
export function palabrasDelBanco(seed: number, op: OpcionesTexto): string[] {
  const min = op.minPalabras ?? PALABRAS_MINIMAS;
  const rng = mulberry32(seed);
  const out: string[] = [];
  while (out.length < min) {
    for (const parrafo of barajado(TEXTOS, rng)) {
      for (const w of parrafo.split(/\s+/).filter(Boolean)) {
        const palabra = op.puntuacion ? w : simplificarPalabra(w);
        if (palabra) out.push(palabra);
      }
    }
  }
  return out.slice(0, min);
}
