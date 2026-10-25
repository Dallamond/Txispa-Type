// Calendario mensual: lógica pura. Meses 1..12, semana que empieza en lunes.

import { sumarDias } from "./estadisticas";

export interface CeldaCalendario {
  /** "YYYY-MM-DD", o null en los huecos de otros meses. */
  dia: string | null;
  cumplido: boolean;
  esHoy: boolean;
  /** Cumplido y el día anterior también, en la misma fila (lunes empieza fila nueva). */
  uneConAnterior: boolean;
}

export interface MesCalendario {
  año: number;
  mes: number;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? "";
}

export function mesDeDia(dia: string): MesCalendario {
  const [año, mes] = dia.split("-").map(Number);
  return { año, mes };
}

export function mesAnterior({ año, mes }: MesCalendario): MesCalendario {
  return mes === 1 ? { año: año - 1, mes: 12 } : { año, mes: mes - 1 };
}

export function mesSiguiente({ año, mes }: MesCalendario): MesCalendario {
  return mes === 12 ? { año: año + 1, mes: 1 } : { año, mes: mes + 1 };
}

export function diasDelMes(año: number, mes: number): number {
  return new Date(Date.UTC(año, mes, 0)).getUTCDate();
}

const pad = (n: number) => String(n).padStart(2, "0");

export function construirMes(año: number, mes: number, hoy: string, cumplidos: ReadonlySet<string>): CeldaCalendario[][] {
  const total = diasDelMes(año, mes);
  const primero = `${año}-${pad(mes)}-01`;
  // getUTCDay: 0 = domingo; se pasa a 0 = lunes.
  const hueco = (new Date(Date.UTC(año, mes - 1, 1)).getUTCDay() + 6) % 7;
  const celdas: CeldaCalendario[] = [];
  for (let i = 0; i < hueco; i++) celdas.push({ dia: null, cumplido: false, esHoy: false, uneConAnterior: false });
  for (let d = 1; d <= total; d++) {
    const dia = sumarDias(primero, d - 1);
    const cumplido = cumplidos.has(dia);
    const columna = celdas.length % 7;
    celdas.push({
      dia,
      cumplido,
      esHoy: dia === hoy,
      uneConAnterior: cumplido && columna > 0 && d > 1 && cumplidos.has(sumarDias(dia, -1)),
    });
  }
  while (celdas.length % 7 !== 0) celdas.push({ dia: null, cumplido: false, esHoy: false, uneConAnterior: false });
  const semanas: CeldaCalendario[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}
