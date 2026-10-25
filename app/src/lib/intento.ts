// Construcción del `Intento` a partir del motor y utilidades de resultado.

import type { Fuente, Intento, Modo, TeclaStat } from "../types";
import type { MotorTecleo } from "./motor";
import { diaLocal } from "./estadisticas";

export interface ConfigIntento {
  modo: Modo;
  fuente: Fuente;
  ejercicioId?: string;
  durationSec: number;
  seed: number;
  estricto: boolean;
}

export function crearIntento(p: {
  motor: MotorTecleo;
  /** Marca de tiempo (ms, mismo reloj que las pulsaciones) del final del intento. */
  ts: number;
  config: ConfigIntento;
  id: string;
  fecha: Date;
}): Intento {
  const { motor, config } = p;
  const m = motor.medidas(p.ts, config.durationSec);
  const agr = motor.agregados();
  const intento: Intento = {
    id: p.id,
    date: p.fecha.toISOString(),
    localDate: diaLocal(p.fecha),
    modo: config.modo,
    fuente: config.fuente,
    durationSec: config.durationSec,
    elapsedSec: m.elapsedSec,
    seed: config.seed,
    estricto: config.estricto,
    correct: motor.correct,
    errors: motor.errors,
    wpm: m.wpm,
    rawWpm: m.rawWpm,
    acc: m.acc,
    consistency: m.consistency,
    teclas: agr.teclas,
    pares: agr.pares,
    confusiones: agr.confusiones,
  };
  if (config.ejercicioId) intento.ejercicioId = config.ejercicioId;
  return intento;
}

/** Teclas con más fallos en un intento, de más a menos. */
export function teclasMasFalladas(
  teclas: Record<string, TeclaStat>,
  max = 6
): { tecla: string; errores: number; pulsaciones: number }[] {
  return Object.entries(teclas)
    .filter(([, s]) => s.e > 0)
    .map(([tecla, s]) => ({ tecla, errores: s.e, pulsaciones: s.n }))
    .sort((a, b) => b.errores - a.errores || b.errores / b.pulsaciones - a.errores / a.pulsaciones)
    .slice(0, max);
}

/** Confusiones más repetidas ("esperada>escrita"), de más a menos. */
export function confusionesMasRepetidas(
  confusiones: Record<string, number>,
  max = 5
): { esperada: string; escrita: string; veces: number }[] {
  return Object.entries(confusiones)
    .map(([k, veces]) => {
      const [esperada, escrita] = k.split(">");
      return { esperada, escrita, veces };
    })
    .sort((a, b) => b.veces - a.veces)
    .slice(0, max);
}

/** Un test solo cuenta como progreso de velocidad si la precisión no baja del 95%. */
export const PRECISION_MINIMA = 95;
