// Plan de entrenamiento y reglas de ajuste (docs/ESPECIFICACION-TECNICA.md §7).
// Todo son funciones puras: "hoy" y los días llegan siempre como "YYYY-MM-DD".

import type { Intento } from "../types";
import { sumarDias, testsDelDia } from "./estadisticas";

// ---------- Día de la semana ----------

/** 0 = lunes … 6 = domingo. Usa Date.UTC: no depende de la zona del sistema. */
export function diaSemana(dia: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const [a, m, d] = dia.split("-").map(Number);
  const domingoCero = new Date(Date.UTC(a, m - 1, d)).getUTCDay(); // 0 = domingo
  return ((domingoCero + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

// ---------- Foco del día ----------

export type NombreDia = "lunes" | "martes" | "miércoles" | "jueves" | "viernes" | "sábado" | "domingo";
export type FuenteEntreno = "banco" | "debiles" | "alternancia" | "ia" | "metronomo";

export interface EntrenoDia {
  fuente: FuenteEntreno;
  /** Minutos del entrenamiento (0 el domingo: ese día solo hay tests de medición). */
  minutos: number;
  descripcion: string;
  /** Fracción de la velocidad media a la que se practica (solo lunes: 0.8). */
  porcentajeVelocidad?: number;
  /** Fuente alternativa si la principal no está disponible (jueves: sin Ollama). */
  respaldo?: "banco";
  /** Duraciones (s) de los tests de medición (solo domingo). */
  tests?: number[];
}

export interface FocoDia {
  dia: NombreDia;
  foco: string;
  entreno: EntrenoDia;
}

const FOCOS: readonly FocoDia[] = [
  {
    dia: "lunes",
    foco: "Precisión",
    entreno: {
      fuente: "banco",
      minutos: 12,
      descripcion: "Texto corrido al 80% de tu velocidad, con meta de 98% o más",
      porcentajeVelocidad: 0.8,
    },
  },
  {
    dia: "martes",
    foco: "Pares débiles",
    entreno: {
      fuente: "debiles",
      minutos: 12,
      descripcion: "6 min con tus pares más lentos y 6 min de texto que los incluya",
    },
  },
  {
    dia: "miércoles",
    foco: "Alternancia de manos",
    entreno: {
      fuente: "alternancia",
      minutos: 12,
      descripcion: "Palabras que alternan manos y texto corrido para fijar el ritmo",
    },
  },
  {
    dia: "jueves",
    foco: "Volumen",
    entreno: {
      fuente: "ia",
      minutos: 12,
      descripcion: "12 min seguidos de texto largo generado por tu IA local (banco si no hay Ollama)",
      respaldo: "banco",
    },
  },
  {
    dia: "viernes",
    foco: "Ritmo constante",
    entreno: {
      fuente: "metronomo",
      minutos: 12,
      descripcion: "Metrónomo y frases al compás, subiendo el pulso poco a poco",
    },
  },
  {
    dia: "sábado",
    foco: "Ligero",
    entreno: {
      fuente: "debiles",
      minutos: 6,
      descripcion: "6 min de teclas débiles; el resto, libre",
    },
  },
  {
    dia: "domingo",
    foco: "Medición",
    entreno: {
      fuente: "banco",
      minutos: 0,
      descripcion: "Un test de 60 s y otro de 120 s como referencia semanal, y revisión del progreso",
      tests: [60, 120],
    },
  },
];

/** Foco y entreno del día. Depende solo del día de la semana, no de lo hecho. */
export function focoDelDia(dia: string): FocoDia {
  const f = FOCOS[diaSemana(dia)];
  return { ...f, entreno: { ...f.entreno, ...(f.entreno.tests ? { tests: [...f.entreno.tests] } : {}) } };
}

// ---------- Reglas de ajuste ----------

export const PORCENTAJE_LENTO_BASE = 0.8;
export const PORCENTAJE_FILA_BASE = 0.6;
/** Regla A: precisión media semanal por debajo de la cual se baja el ritmo. */
export const UMBRAL_PRECISION_BAJA = 95;
/** Regla B: precisión diaria a partir de la cual cuenta como día bueno. */
export const UMBRAL_PRECISION_ALTA = 97;
/** Mínimo de tests en la semana evaluada para que la regla A aplique. */
export const MIN_TESTS_REGLA_A = 3;
const FACTOR_A = 0.9; // 10% relativo más despacio
const FACTOR_B = 1.05; // 5% relativo más rápido
const DIAS_SEGUIDOS_B = 3;

export interface Ajuste {
  id: "mas-despacio" | "mas-rapido";
  motivo: string;
  porcentajeLento: number;
  porcentajeFilaBase: number;
}

export interface ResultadoAjustes {
  porcentajeLento: number;
  porcentajeFilaBase: number;
  ajustes: Ajuste[];
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

function pct1(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

function mediaAcc(tests: Intento[]): number {
  return tests.reduce((s, t) => s + t.acc, 0) / tests.length;
}

/**
 * Decisiones:
 * - Solo cuentan intentos de modo "test".
 * - Regla A: "semana anterior" = los 7 días previos a la ventana de los últimos 7, es decir
 *   [hoy-13, hoy-7]. Con menos de 3 tests en ella no se evalúa. Si la media de `acc` < 95,
 *   los dos porcentajes bajan un 10% relativo (0.72 y 0.54).
 * - Regla B: la precisión de un día es la media de `acc` de sus tests. Se toma el último día
 *   con tests (<= hoy) y se exige que ese día y los dos días naturales anteriores tengan tests
 *   y cada uno >= 97. Entonces el % del texto lento sube un 5% relativo (0.84); la fila base no cambia.
 * - Si aplican las dos gana la A (seguridad): la B se descarta.
 * - Con `reglasActivas` = false se devuelven los porcentajes base sin ajustes.
 */
export function calcularAjustes(intentos: Intento[], hoy: string, reglasActivas: boolean): ResultadoAjustes {
  const base: ResultadoAjustes = {
    porcentajeLento: PORCENTAJE_LENTO_BASE,
    porcentajeFilaBase: PORCENTAJE_FILA_BASE,
    ajustes: [],
  };
  if (!reglasActivas) return base;

  // Regla A
  const desde = sumarDias(hoy, -13);
  const hasta = sumarDias(hoy, -7);
  const semanaAnterior = intentos.filter((i) => i.modo === "test" && i.localDate >= desde && i.localDate <= hasta);
  if (semanaAnterior.length >= MIN_TESTS_REGLA_A) {
    const acc = mediaAcc(semanaAnterior);
    if (acc < UMBRAL_PRECISION_BAJA) {
      const porcentajeLento = redondear(PORCENTAJE_LENTO_BASE * FACTOR_A);
      const porcentajeFilaBase = redondear(PORCENTAJE_FILA_BASE * FACTOR_A);
      return {
        porcentajeLento,
        porcentajeFilaBase,
        ajustes: [
          {
            id: "mas-despacio",
            motivo: `Esta semana, 10% más despacio: tu precisión fue ${pct1(acc)}%`,
            porcentajeLento,
            porcentajeFilaBase,
          },
        ],
      };
    }
  }

  // Regla B
  const diasConTests = intentos
    .filter((i) => i.modo === "test" && i.localDate <= hoy)
    .map((i) => i.localDate)
    .sort();
  const ultimo = diasConTests[diasConTests.length - 1];
  if (ultimo) {
    const accs: number[] = [];
    for (let k = 0; k < DIAS_SEGUIDOS_B; k++) {
      const tests = testsDelDia(intentos, sumarDias(ultimo, -k));
      if (tests.length === 0) break;
      accs.push(mediaAcc(tests));
    }
    if (accs.length === DIAS_SEGUIDOS_B && accs.every((a) => a >= UMBRAL_PRECISION_ALTA)) {
      const porcentajeLento = redondear(PORCENTAJE_LENTO_BASE * FACTOR_B);
      return {
        porcentajeLento,
        porcentajeFilaBase: PORCENTAJE_FILA_BASE,
        ajustes: [
          {
            id: "mas-rapido",
            motivo: `Texto lento un 5% más rápido: llevas ${DIAS_SEGUIDOS_B} días seguidos con precisión de ${UMBRAL_PRECISION_ALTA}% o más`,
            porcentajeLento,
            porcentajeFilaBase: PORCENTAJE_FILA_BASE,
          },
        ],
      };
    }
  }

  return base;
}

// ---------- Pasos del día ----------

export interface PasoPlan {
  id: "calentamiento" | "entreno" | "tests" | "revision";
  titulo: string;
  detalle: string;
  hecho: boolean;
  /** true si la app no puede saber si se hizo: lo marca el usuario. */
  manual?: boolean;
}

/**
 * Lista de pasos del plan. El foco sale de `dia`; lo hecho se mide sobre los intentos de `hoy`.
 * - tests: hecho si los tests de hoy >= objetivoTests.
 * - entreno: hecho si hay algún intento "entreno" hoy con fuente distinta de "ejercicio".
 * - calentamiento y revisión no se guardan: hecho false y manual true.
 */
export function pasosDelDia(dia: string, hoy: string, intentos: Intento[], objetivoTests: number): PasoPlan[] {
  const foco = focoDelDia(dia);
  const e = foco.entreno;
  const testsHoy = testsDelDia(intentos, hoy).length;
  const entrenoHecho = intentos.some((i) => i.localDate === hoy && i.modo === "entreno" && i.fuente !== "ejercicio");

  const detalleEntreno =
    e.minutos > 0 ? `${foco.foco} (${e.minutos} min): ${e.descripcion}` : `${foco.foco}: ${e.descripcion}`;
  const detalleTests = e.tests
    ? `${e.tests.map((s) => `${s} s`).join(" y ")} de referencia (mínimo ${objetivoTests} tests hoy)`
    : `${objetivoTests} tests de 1 min, con descanso entre ellos (${testsHoy}/${objetivoTests})`;

  return [
    { id: "calentamiento", titulo: "Calentamiento", detalle: "Tecleo suave de unos 5 min para soltar las manos", hecho: false, manual: true },
    { id: "entreno", titulo: e.minutos > 0 ? "Entrenamiento" : "Sin entrenamiento", detalle: detalleEntreno, hecho: entrenoHecho },
    { id: "tests", titulo: "Tests", detalle: detalleTests, hecho: testsHoy >= objetivoTests },
    { id: "revision", titulo: "Revisión de errores", detalle: "2 min con las confusiones y los pares lentos del día", hecho: false, manual: true },
  ];
}
