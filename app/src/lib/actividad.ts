// Mapa de actividad anual (como el de contribuciones de GitHub): lógica pura.
// Columnas = semanas de lunes a domingo; la última es la semana de hoy.
// Cuentan tests y entrenos guardados; los calentamientos no se guardan y no salen.

import type { Intento } from "../types";
import { sumarDias } from "./estadisticas";

export interface CeldaActividad {
  dia: string;
  /** Aciertos más errores de ese día. */
  pulsaciones: number;
  /** Tiempo real tecleando (suma de elapsedSec). */
  segundos: number;
  tests: number;
  entrenos: number;
  /** 0 = sin práctica; 1-3 = parte de la meta de minutos; 4 = meta cumplida. */
  nivel: 0 | 1 | 2 | 3 | 4;
  /** Día posterior a hoy (relleno de la última semana): no se pinta. */
  futuro: boolean;
}

export interface EtiquetaMes {
  columna: number;
  nombre: string;
}

export interface MapaActividad {
  /** Una columna por semana, siete celdas cada una (lunes primero). */
  columnas: CeldaActividad[][];
  meses: EtiquetaMes[];
  diasConPractica: number;
  pulsaciones: number;
  segundos: number;
}

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** 0 = lunes … 6 = domingo, sin depender de la zona del sistema. */
function columnaDelDia(dia: string): number {
  const [a, m, d] = dia.split("-").map(Number);
  return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
}

/**
 * Nivel de color según la meta diaria de minutos: la meta cumplida es el color más fuerte.
 * Por debajo, tres escalones de un tercio. Con meta 0 cualquier práctica es nivel 4.
 */
export function nivelDeActividad(segundos: number, pulsaciones: number, objetivoMin: number): CeldaActividad["nivel"] {
  if (segundos <= 0 && pulsaciones <= 0) return 0;
  const meta = objetivoMin * 60;
  if (meta <= 0 || segundos >= meta) return 4;
  const f = segundos / meta;
  return f < 1 / 3 ? 1 : f < 2 / 3 ? 2 : 3;
}

/** Mapa de las últimas `semanas` semanas hasta hoy (incluida la semana en curso). */
export function mapaActividad(intentos: readonly Intento[], hoy: string, objetivoMin: number, semanas = 53): MapaActividad {
  const porDia = new Map<string, { pulsaciones: number; segundos: number; tests: number; entrenos: number }>();
  for (const i of intentos) {
    const d = porDia.get(i.localDate) ?? { pulsaciones: 0, segundos: 0, tests: 0, entrenos: 0 };
    d.pulsaciones += i.correct + i.errors;
    d.segundos += i.elapsedSec;
    if (i.modo === "test") d.tests += 1;
    else d.entrenos += 1;
    porDia.set(i.localDate, d);
  }

  const lunesActual = sumarDias(hoy, -columnaDelDia(hoy));
  const primerLunes = sumarDias(lunesActual, -7 * (semanas - 1));
  const columnas: CeldaActividad[][] = [];
  const meses: EtiquetaMes[] = [];
  let diasConPractica = 0;
  let pulsaciones = 0;
  let segundos = 0;

  for (let s = 0; s < semanas; s++) {
    const lunes = sumarDias(primerLunes, 7 * s);
    const columna: CeldaActividad[] = [];
    for (let k = 0; k < 7; k++) {
      const dia = sumarDias(lunes, k);
      const futuro = dia > hoy;
      const d = futuro ? undefined : porDia.get(dia);
      const celda: CeldaActividad = {
        dia,
        pulsaciones: d?.pulsaciones ?? 0,
        segundos: d?.segundos ?? 0,
        tests: d?.tests ?? 0,
        entrenos: d?.entrenos ?? 0,
        nivel: d ? nivelDeActividad(d.segundos, d.pulsaciones, objetivoMin) : 0,
        futuro,
      };
      if (celda.nivel > 0) {
        diasConPractica += 1;
        pulsaciones += celda.pulsaciones;
        segundos += celda.segundos;
      }
      columna.push(celda);
    }
    columnas.push(columna);
    // El nombre del mes va en la semana que contiene su día 1 (y en la primera columna, si no es muy tarde).
    const conDiaUno = columna.find((c) => c.dia.endsWith("-01"));
    if (conDiaUno) meses.push({ columna: s, nombre: MESES_CORTOS[Number(conDiaUno.dia.slice(5, 7)) - 1] });
    else if (s === 0 && Number(lunes.slice(8)) <= 14) meses.push({ columna: 0, nombre: MESES_CORTOS[Number(lunes.slice(5, 7)) - 1] });
  }

  return { columnas, meses, diasConPractica, pulsaciones, segundos };
}
