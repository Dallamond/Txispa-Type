// Estadísticas de velocidad: funciones puras sobre la lista de intentos.
// Solo cuentan los intentos con modo "test". Nada depende del reloj del sistema:
// lo que necesita "hoy" lo recibe como cadena "YYYY-MM-DD".
import type { Intento } from "../types";

export interface MediaVelocidad {
  wpm: number;
  acc: number;
  n: number;
}

export interface MediaSemana {
  /** Último día (incluido) de la ventana de 7 días. */
  semanaTermina: string;
  wpm: number | null;
  n: number;
}

export interface ObjetivoDia {
  hechos: number;
  objetivo: number;
  cumplido: boolean;
  /** 0..1, tope en 1. */
  fraccion: number;
}

export interface FilaDia {
  dia: string;
  tests: number;
  mediaWpm: number;
  mejorWpm: number;
  peorWpm: number;
  medianaWpm: number;
  mediaAcc: number;
}

// ---------- Fechas ----------

/** Suma `n` días (puede ser negativo) a un día "YYYY-MM-DD", sin depender de la zona del sistema. */
export function sumarDias(dia: string, n: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  const ms = Date.UTC(a, m - 1, d + n);
  return new Date(ms).toISOString().slice(0, 10);
}

/** Día "YYYY-MM-DD" en hora local de Madrid. */
export function diaLocal(date: Date): string {
  return date.toLocaleDateString("sv", { timeZone: "Europe/Madrid" });
}

// ---------- Utilidades internas ----------

function media(valores: number[]): number {
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

function mediana(valores: number[]): number {
  const orden = [...valores].sort((a, b) => a - b);
  const mitad = Math.floor(orden.length / 2);
  return orden.length % 2 === 1 ? orden[mitad] : (orden[mitad - 1] + orden[mitad]) / 2;
}

function mediaDe(tests: Intento[]): MediaVelocidad | null {
  if (tests.length === 0) return null;
  return { wpm: media(tests.map((t) => t.wpm)), acc: media(tests.map((t) => t.acc)), n: tests.length };
}

function enRango(intentos: Intento[], desde: string, hasta: string): Intento[] {
  return soloTests(intentos).filter((t) => t.localDate >= desde && t.localDate <= hasta);
}

// ---------- Filtros y medias ----------

/** Solo los intentos de modo test. */
export function soloTests(intentos: Intento[]): Intento[] {
  return intentos.filter((i) => i.modo === "test");
}

/** Media de wpm y precisión de los tests de los 7 días naturales que terminan en `hoy` (incluido). */
export function mediaSemanal(intentos: Intento[], hoy: string): MediaVelocidad | null {
  return mediaDe(enRango(intentos, sumarDias(hoy, -6), hoy));
}

/** Tests de un día concreto. */
export function testsDelDia(intentos: Intento[], dia: string): Intento[] {
  return soloTests(intentos).filter((t) => t.localDate === dia);
}

/** Mediana de wpm de los tests del día, o null si no hay. */
export function medianaDelDia(intentos: Intento[], dia: string): number | null {
  const tests = testsDelDia(intentos, dia);
  return tests.length === 0 ? null : mediana(tests.map((t) => t.wpm));
}

/** Peor wpm de los tests del día, o null si no hay. */
export function peorDelDia(intentos: Intento[], dia: string): number | null {
  const tests = testsDelDia(intentos, dia);
  return tests.length === 0 ? null : Math.min(...tests.map((t) => t.wpm));
}

/** Media de wpm y precisión de los últimos `n` tests (por fecha), pudiendo excluir uno por id. */
export function mediaUltimos(intentos: Intento[], n: number, excluirId?: string): MediaVelocidad | null {
  if (n <= 0) return null;
  const tests = soloTests(intentos)
    .filter((t) => t.id !== excluirId)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return mediaDe(tests.slice(-n));
}

/** Medias por ventanas de 7 días hacia atrás desde `hoy`, de la más antigua a la más reciente. */
export function mediasSemanales(intentos: Intento[], hoy: string, semanas = 8): MediaSemana[] {
  const salida: MediaSemana[] = [];
  for (let i = semanas - 1; i >= 0; i--) {
    const termina = sumarDias(hoy, -7 * i);
    const tests = enRango(intentos, sumarDias(termina, -6), termina);
    salida.push({
      semanaTermina: termina,
      wpm: tests.length === 0 ? null : media(tests.map((t) => t.wpm)),
      n: tests.length,
    });
  }
  return salida;
}

/** Pendiente de la regresión lineal (wpm por semana), ignorando semanas sin datos. Null con menos de 2 puntos. */
export function tendencia(medias: MediaSemana[]): number | null {
  const puntos: Array<[number, number]> = [];
  medias.forEach((m, i) => {
    if (m.wpm !== null) puntos.push([i, m.wpm]);
  });
  if (puntos.length < 2) return null;
  const mx = media(puntos.map((p) => p[0]));
  const my = media(puntos.map((p) => p[1]));
  let num = 0;
  let den = 0;
  for (const [x, y] of puntos) {
    num += (x - mx) * (y - my);
    den += (x - mx) ** 2;
  }
  return num / den;
}

/** Variación porcentual de la última semana frente a la anterior. Null si falta alguna o la anterior es 0. */
export function variacionSemanal(medias: MediaSemana[]): number | null {
  if (medias.length < 2) return null;
  const actual = medias[medias.length - 1].wpm;
  const previa = medias[medias.length - 2].wpm;
  if (actual === null || previa === null || previa === 0) return null;
  return ((actual - previa) / previa) * 100;
}

// ---------- Objetivo y racha ----------

/** Fechas con el objetivo diario cumplido. */
export function diasCumplidos(intentos: Intento[], objetivoTests: number): Set<string> {
  const cuenta = new Map<string, number>();
  for (const t of soloTests(intentos)) cuenta.set(t.localDate, (cuenta.get(t.localDate) ?? 0) + 1);
  const dias = new Set<string>();
  for (const [dia, n] of cuenta) if (n >= objetivoTests) dias.add(dia);
  return dias;
}

/** Progreso del día de hoy frente al objetivo. */
export function objetivoDelDia(intentos: Intento[], hoy: string, objetivoTests: number): ObjetivoDia {
  const hechos = testsDelDia(intentos, hoy).length;
  const fraccion = objetivoTests <= 0 ? 1 : Math.min(1, hechos / objetivoTests);
  return { hechos, objetivo: objetivoTests, cumplido: hechos >= objetivoTests, fraccion };
}

/** Días consecutivos con objetivo cumplido. Si hoy aún no cumple, la racha cuenta desde ayer. */
export function racha(intentos: Intento[], hoy: string, objetivoTests: number): number {
  const cumplidos = diasCumplidos(intentos, objetivoTests);
  let dia = cumplidos.has(hoy) ? hoy : sumarDias(hoy, -1);
  let cuenta = 0;
  while (cumplidos.has(dia)) {
    cuenta++;
    dia = sumarDias(dia, -1);
  }
  return cuenta;
}

// ---------- Tabla por día ----------

/** Resumen de los últimos `dias` días (hoy incluido) con al menos un test, el más reciente primero. */
export function resumenPorDia(intentos: Intento[], dias = 14, hoy: string): FilaDia[] {
  const filas: FilaDia[] = [];
  for (let i = 0; i < dias; i++) {
    const dia = sumarDias(hoy, -i);
    const tests = testsDelDia(intentos, dia);
    if (tests.length === 0) continue;
    const wpms = tests.map((t) => t.wpm);
    filas.push({
      dia,
      tests: tests.length,
      mediaWpm: media(wpms),
      mejorWpm: Math.max(...wpms),
      peorWpm: Math.min(...wpms),
      medianaWpm: mediana(wpms),
      mediaAcc: media(tests.map((t) => t.acc)),
    });
  }
  return filas;
}
