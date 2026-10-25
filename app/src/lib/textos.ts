// Generación de texto. Todo es determinista a partir de `seed` (mulberry32)
// para poder repetir un texto exacto. Fuentes: `banco`, `debiles` y `alternancia`
// (la fuente `ia` vive en lib/ia.ts).

import { CHARMAP, KEY_BY_ID } from "../data/keyboard";
import { PALABRAS } from "../data/palabras";
import { TEXTOS } from "../data/textos";
import type { Analisis } from "./debiles";
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

// ---------- Teclas débiles ----------

/** Letra sin tilde ("á" → "a"), para buscar su estadística si la acentuada no tiene. */
function base(ch: string): string {
  return ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Peso extra de una palabra según tus teclas y pares débiles (especificación §4):
 * `(Σ pesoLetra × 1,2 + Σ pesoPar × 2) / √longitud`, con `pesoLetra = min(puntuación, 6)`
 * y `pesoPar = latRel − 1`. */
export function refuerzoPalabra(palabra: string, analisis: Analisis, soloPares = false): number {
  const letras = new Map(analisis.debiles.map((t) => [t.tecla, Math.min(t.puntuacion, 6)]));
  const pares = new Map(analisis.pares.map((p) => [p.par, p.latRel - 1]));
  let suma = 0;
  for (let i = 0; i < palabra.length; i++) {
    const c = palabra[i];
    if (!soloPares) suma += (letras.get(c) ?? letras.get(base(c)) ?? 0) * 1.2;
    if (i > 0) {
      const par = palabra[i - 1] + c;
      suma += (pares.get(par) ?? pares.get(base(palabra[i - 1]) + base(c)) ?? 0) * 2;
    }
  }
  return suma / Math.sqrt(palabra.length);
}

/** Muestreo ponderado de `n` palabras sin repetir la misma dos veces seguidas. */
function muestreo(pool: readonly string[], pesos: readonly number[], n: number, rng: () => number): string[] {
  const total = pesos.reduce((a, b) => a + b, 0);
  const out: string[] = [];
  let ultima = -1;
  while (out.length < n) {
    let r = rng() * total;
    let i = 0;
    while (i < pool.length - 1 && (r -= pesos[i]) > 0) i++;
    if (i === ultima && pool.length > 1) continue;
    out.push(pool[i]);
    ultima = i;
  }
  return out;
}

/** Agrupa palabras en frases de 6 a 12 con mayúscula inicial, punto final y alguna coma. */
export function agruparEnFrases(palabras: readonly string[], rng: () => number): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < palabras.length) {
    const largo = Math.min(6 + Math.floor(rng() * 7), palabras.length - i);
    const frase = palabras.slice(i, i + largo);
    i += largo;
    frase[0] = frase[0][0].toUpperCase() + frase[0].slice(1);
    for (let j = 2; j < frase.length - 1; j++) {
      if (rng() < 0.12) {
        frase[j] += ",";
        break;
      }
    }
    frase[frase.length - 1] += ".";
    out.push(...frase);
  }
  return out;
}

function conPuntuacion(palabras: string[], op: OpcionesTexto, rng: () => number): string[] {
  return op.puntuacion ? agruparEnFrases(palabras, rng) : palabras;
}

/** Fuente `debiles`: palabras comunes con más peso las que llevan tus teclas y
 * pares débiles. Sin datos que reforzar cae al banco. */
export function palabrasDebiles(seed: number, analisis: Analisis, op: OpcionesTexto, soloPares = false): string[] {
  const hayQueReforzar = soloPares ? analisis.pares.length > 0 : analisis.debiles.length > 0 || analisis.pares.length > 0;
  if (!hayQueReforzar) return palabrasDelBanco(seed, op);
  const rng = mulberry32(seed);
  const pesos = PALABRAS.map((w) => 1 + 3 * refuerzoPalabra(w, analisis, soloPares));
  return conPuntuacion(muestreo(PALABRAS, pesos, op.minPalabras ?? PALABRAS_MINIMAS, rng), op, rng);
}

// ---------- Alternancia de manos ----------

type Mano = "izq" | "der";

/** Mano que pulsa un carácter (los dedos 0-3 son la izquierda y 4-7 la derecha), o null. */
export function manoDe(ch: string): Mano | null {
  const id = CHARMAP[ch]?.key;
  const dedo = id ? KEY_BY_ID[id]?.finger : undefined;
  if (dedo === undefined || dedo > 7) return null;
  return dedo <= 3 ? "izq" : "der";
}

/** Fracción de pares de letras consecutivos que cambian de mano (0 si no hay pares). */
export function fraccionAlternancia(palabra: string): number {
  let pares = 0;
  let cambios = 0;
  for (let i = 1; i < palabra.length; i++) {
    const a = manoDe(base(palabra[i - 1]));
    const b = manoDe(base(palabra[i]));
    if (!a || !b) continue;
    pares++;
    if (a !== b) cambios++;
  }
  return pares === 0 ? 0 : cambios / pares;
}

let cacheAlternancia: string[] | null = null;

/** Palabras en las que al menos el 70% de los pares cambian de mano. */
export function palabrasQueAlternan(): string[] {
  return (cacheAlternancia ??= PALABRAS.filter((w) => w.length >= 3 && fraccionAlternancia(w) >= 0.7));
}

export function palabrasAlternancia(seed: number, op: OpcionesTexto): string[] {
  const rng = mulberry32(seed);
  const pool = palabrasQueAlternan();
  const pesos = pool.map(() => 1);
  return conPuntuacion(muestreo(pool, pesos, op.minPalabras ?? PALABRAS_MINIMAS, rng), op, rng);
}
