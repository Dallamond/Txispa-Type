// Geometría del gráfico de evolución (N19).
//
// Está fuera del componente porque son decisiones que se pueden equivocar en
// silencio —una escala que recorta la línea, dos fechas encabalgadas— y que no
// se ven en una captura si justo esa tanda de datos no las provoca. Aquí son
// funciones puras y `scripts/check-mecanografia.ts` las barre enteras.

/** Extremos "redondos" del eje Y.
 *
 * Nunca arranca en el mínimo exacto: una línea pegada al borde inferior parece
 * que has tocado fondo cuando lo único que pasa es que ese es tu peor intento.
 * La precisión es el caso aparte — tiene techo real en 100 y fijarlo evita que
 * un 97 % parezca un récord absoluto solo por ser el mejor de la tanda. */
export function dominioY(
  vals: readonly number[],
  metrica: "wpm" | "acc"
): { lo: number; hi: number } {
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (metrica === "acc") {
    return { lo: Math.max(0, Math.floor((min - 4) / 5) * 5), hi: 100 };
  }
  const margen = Math.max(5, Math.round((max - min) * 0.15));
  const lo = Math.max(0, Math.floor((min - margen) / 10) * 10);
  const hi = Math.ceil((max + margen) / 10) * 10;
  return { lo, hi: hi <= lo ? lo + 10 : hi };
}

/** Qué intentos llevan etiqueta de fecha en el eje X.
 *
 * Como mucho seis repartidas, y la última SIEMPRE: es la que se mira. Se
 * descarta la penúltima si cae demasiado cerca del final, porque si no el
 * reparto regular y el último punto se solapan y quedan dos fechas
 * encabalgadas justo donde más importa. */
export function indicesEjeX(n: number): number[] {
  if (n <= 0) return [];
  const paso = Math.max(1, Math.ceil(n / 6));
  const out: number[] = [];
  for (let i = 0; i < n; i += paso) {
    if (n - 1 - i >= paso * 0.6) out.push(i);
  }
  out.push(n - 1);
  return out;
}
