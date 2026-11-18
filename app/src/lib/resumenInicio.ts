// Cifras del resumen de estadísticas que se enseña en Inicio. Funciones puras: "hoy" llega como "YYYY-MM-DD".
import type { Intento } from "../types";
import { PRECISION_MINIMA } from "./medidas";
import { soloTests, sumarDias, type MediaVelocidad } from "./estadisticas";

export interface ResumenInicio {
  /** Tests guardados en total (no entrenos ni lecciones). */
  testsTotales: number;
  /** Mejor ppm de un test con precisión digna, o null si no hay ninguno. */
  mejorWpm: number | null;
  /** Media de los tests de los últimos 30 días naturales que terminan en `hoy`, o null. */
  media30: MediaVelocidad | null;
  /** Días distintos con al menos un intento (de cualquier modo) en esos 30 días. */
  diasPracticados30: number;
}

export function resumenInicio(intentos: readonly Intento[], hoy: string): ResumenInicio {
  const desde = sumarDias(hoy, -29);
  const tests = soloTests([...intentos]);
  const recientes = tests.filter((t) => t.localDate >= desde && t.localDate <= hoy);

  let mejorWpm: number | null = null;
  for (const t of tests) {
    if (t.acc < PRECISION_MINIMA) continue;
    if (mejorWpm === null || t.wpm > mejorWpm) mejorWpm = t.wpm;
  }

  const dias = new Set<string>();
  for (const i of intentos) if (i.localDate >= desde && i.localDate <= hoy) dias.add(i.localDate);

  const media30 =
    recientes.length === 0
      ? null
      : {
          wpm: recientes.reduce((s, t) => s + t.wpm, 0) / recientes.length,
          acc: recientes.reduce((s, t) => s + t.acc, 0) / recientes.length,
          n: recientes.length,
        };

  return { testsTotales: tests.length, mejorWpm, media30, diasPracticados30: dias.size };
}

/** "HTML", "HTML y CSS" o "HTML, CSS y Linux". */
export function listaConY(nombres: readonly string[]): string {
  if (nombres.length <= 1) return nombres.join("");
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}
