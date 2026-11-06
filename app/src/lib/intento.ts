// Construcción del `Intento` a partir del motor y utilidades de resultado.

import type { Fuente, Intento, Modo, TeclaStat } from "../types";
import type { congelar } from "./agregados";
import type { Medidas } from "./medidas";
import { diaLocal } from "./estadisticas";

/** Lo que `crearIntento` necesita de un motor; lo cumplen `MotorTecleo` y `MotorCodigo`. */
export interface MotorMedible {
  readonly correct: number;
  readonly errors: number;
  medidas(ts: number, durationSec: number): Medidas;
  agregados(): ReturnType<typeof congelar>;
}

export interface ConfigIntento {
  modo: Modo;
  fuente: Fuente;
  ejercicioId?: string;
  leccionId?: string;
  iaHashes?: string[];
  durationSec: number;
  seed: number;
  estricto: boolean;
}

export function crearIntento(p: {
  motor: MotorMedible;
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
  if (config.leccionId) intento.leccionId = config.leccionId;
  if (config.iaHashes && config.iaHashes.length > 0) intento.iaHashes = config.iaHashes;
  return intento;
}

/** Tope de tiempo con el que se miden las lecciones, que no tienen cuenta atrás (1 hora). */
export const TOPE_LECCION_SEG = 3600;

/** Intento de una lección del curso: un entreno de fuente "curso" cuya duración es lo que se tardó. */
export function crearIntentoLeccion(p: {
  motor: MotorMedible;
  ts: number;
  /** "html/L01.01". */
  leccionId: string;
  estricto: boolean;
  id: string;
  fecha: Date;
}): Intento {
  const intento = crearIntento({
    motor: p.motor,
    ts: p.ts,
    id: p.id,
    fecha: p.fecha,
    config: {
      modo: "entreno",
      fuente: "curso",
      leccionId: p.leccionId,
      durationSec: TOPE_LECCION_SEG,
      seed: 0,
      estricto: p.estricto,
    },
  });
  intento.durationSec = Math.ceil(intento.elapsedSec);
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
