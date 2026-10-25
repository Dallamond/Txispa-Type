// Confusiones agregadas de la ventana de intentos recientes (ver §3 de la especificación).

import type { Intento } from "../types";
import { VENTANA_INTENTOS } from "./debiles";

export interface ConfusionAgregada {
  esperada: string;
  escrita: string;
  veces: number;
  /** Porcentaje (0..100) sobre el total de confusiones de la ventana. */
  porcentaje: number;
}

/** Suma las confusiones de los últimos `ventana` intentos y devuelve las `max` más repetidas. */
export function confusionesAgregadas(intentos: readonly Intento[], ventana = VENTANA_INTENTOS, max = 10): ConfusionAgregada[] {
  const usados = [...intentos].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-ventana);
  const suma = new Map<string, number>();
  let total = 0;
  for (const i of usados) {
    for (const [clave, veces] of Object.entries(i.confusiones ?? {})) {
      if (!(veces > 0)) continue;
      suma.set(clave, (suma.get(clave) ?? 0) + veces);
      total += veces;
    }
  }
  return [...suma.entries()]
    .map(([clave, veces]) => {
      const sep = clave.indexOf(">");
      return { esperada: clave.slice(0, sep), escrita: clave.slice(sep + 1), veces, porcentaje: (veces / total) * 100 };
    })
    .sort((a, b) => b.veces - a.veces || (a.esperada + a.escrita < b.esperada + b.escrita ? -1 : 1))
    .slice(0, max);
}
