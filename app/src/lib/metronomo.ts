// Metrónomo: pulsos al ritmo de `wpm × 5 / 60` pulsaciones por segundo y medida
// de cuánto se desvían tus pulsaciones del pulso.

/** Milisegundos entre pulsos para una velocidad en palabras por minuto. */
export function periodoMs(wpm: number): number {
  return 60000 / (wpm * 5);
}

/** Distancia (ms) de una pulsación al pulso más cercano de la rejilla `t0 + k × periodo`. */
export function desviacionAlPulso(ts: number, t0: number, periodo: number): number {
  const r = (((ts - t0) % periodo) + periodo) % periodo;
  return Math.min(r, periodo - r);
}

/** Media de desviaciones (ms), o null si no hay ninguna. */
export function desviacionMedia(desvios: readonly number[]): number | null {
  return desvios.length === 0 ? null : desvios.reduce((a, b) => a + b, 0) / desvios.length;
}

/** Límites del pulso ajustable (wpm). */
export const PULSO_MIN_WPM = 20;
export const PULSO_MAX_WPM = 120;

export function limitarPulso(wpm: number): number {
  return Math.min(PULSO_MAX_WPM, Math.max(PULSO_MIN_WPM, Math.round(wpm)));
}
