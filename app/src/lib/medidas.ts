// Medidas de un intento. Fórmulas de docs/ESPECIFICACION-TECNICA.md §3.
// Una palabra son 5 caracteres, contando el espacio. Aquí `wpm` son palabras
// por minuto (lo que la interfaz llama "ppm"); en Shellpath `ppm` eran pulsaciones.

export const CARACTERES_POR_PALABRA = 5;
/** Un intervalo entre pulsaciones solo vale entre estos extremos (ms). */
export const INTERVALO_MIN_MS = 1;
export const INTERVALO_MAX_MS = 2000;
/** Con menos intervalos válidos no se calcula la consistencia. */
export const INTERVALOS_MIN_CONSISTENCIA = 20;
/** CV a partir del cual la consistencia llega a 0 (valor inicial heurístico). */
export const CV_CERO = 1.6;

export function redondear(n: number, decimales = 1): number {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}

/** Tiempo usado para medir: el real desde la primera pulsación, sin pasar de la
 * duración elegida y con un mínimo de 1 s para no dividir entre casi cero. */
export function segundosMedidos(realSec: number, durationSec: number): number {
  return Math.max(1, Math.min(realSec, durationSec));
}

/** Palabras por minuto netas: solo caracteres correctos. */
export function wpmNeta(correct: number, elapsedSec: number): number {
  return correct / CARACTERES_POR_PALABRA / (elapsedSec / 60);
}

/** Palabras por minuto brutas: todos los caracteres tecleados. */
export function wpmBruta(correct: number, errors: number, elapsedSec: number): number {
  return (correct + errors) / CARACTERES_POR_PALABRA / (elapsedSec / 60);
}

/** Precisión 0-100. Sin pulsaciones es 100. */
export function precision(correct: number, errors: number): number {
  const total = correct + errors;
  return total === 0 ? 100 : (correct / total) * 100;
}

/** Ritmo constante 0-100 a partir de los intervalos válidos, o null si hay pocos.
 * `CV = desviación / media` y `100 × (1 − CV / 1.6)` acotado a [0, 100]. */
export function consistencia(intervalos: readonly number[]): number | null {
  if (intervalos.length < INTERVALOS_MIN_CONSISTENCIA) return null;
  const media = intervalos.reduce((a, b) => a + b, 0) / intervalos.length;
  if (media <= 0) return null;
  const varianza = intervalos.reduce((a, b) => a + (b - media) ** 2, 0) / intervalos.length;
  const cv = Math.sqrt(varianza) / media;
  return Math.min(100, Math.max(0, 100 * (1 - cv / CV_CERO)));
}

export interface Medidas {
  elapsedSec: number;
  wpm: number;
  rawWpm: number;
  acc: number;
  consistency: number | null;
}

export function calcularMedidas(p: {
  correct: number;
  errors: number;
  realSec: number;
  durationSec: number;
  intervalos: readonly number[];
}): Medidas {
  const elapsed = segundosMedidos(p.realSec, p.durationSec);
  const cons = consistencia(p.intervalos);
  return {
    elapsedSec: redondear(elapsed, 2),
    wpm: redondear(wpmNeta(p.correct, elapsed)),
    rawWpm: redondear(wpmBruta(p.correct, p.errors, elapsed)),
    acc: redondear(precision(p.correct, p.errors)),
    consistency: cons === null ? null : redondear(cons),
  };
}
