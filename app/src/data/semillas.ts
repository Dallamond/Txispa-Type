// Semillas iniciales: tasas de fallo de typing.com (capturas del 24 y 25 de
// octubre de 2026). NO son verdades sobre el usuario: sirven para que el
// entrenamiento dirigido tenga algo con lo que empezar hasta que haya datos
// propios. Se ven marcadas como "semilla" en estadísticas.
//
// Hasta que una tecla acumule SEMILLA_HASTA pulsaciones propias, se le suma una
// semilla de SEMILLA_PULSACIONES pulsaciones ficticias con esta tasa de error.

export const SEMILLAS_ERROR: Readonly<Record<string, number>> = {
  v: 0.17,
  x: 0.11,
  u: 0.09,
  y: 0.08,
};

/** Teclas que typing.com marca como "necesita mejorar" (sin tasa concreta). */
export const SEMILLAS_MEJORAR: readonly string[] = ["t", "d", "g", "c", "b", "m"];

export const SEMILLA_PULSACIONES = 50;
export const SEMILLA_HASTA = 100;
