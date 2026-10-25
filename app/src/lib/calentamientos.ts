// Calentamientos: datos y generadores puros. No se guardan ni cuentan para
// ninguna estadística. Ver docs/ESPECIFICACION-TECNICA.md §5.

import type { Rutina } from "../types";
import { mulberry32 } from "./rng";
import { palabrasDelBanco } from "./textos";

export type IdEjercicio =
  | "manos"
  | "arana"
  | "escala"
  | "fila-base"
  | "alternancia"
  | "pares"
  | "lento"
  | "escalera"
  | "metronomo";

export type TipoEjercicio = "guiado" | "texto";

export interface Ejercicio {
  id: IdEjercicio;
  nombre: string;
  segundos: number;
  tipo: TipoEjercicio;
  /** Qué entrena. */
  entrena: string;
  /** Instrucciones breves. */
  detalle: string;
  /** Porcentaje del wpm medio al que avanza el cursor fantasma (solo `texto`). */
  fantasma?: number;
  /** Se puede hacer ya con lo que hay construido. */
  disponible: boolean;
}

export const EJERCICIOS: Record<IdEjercicio, Ejercicio> = {
  manos: {
    id: "manos",
    nombre: "Estiramiento de manos",
    segundos: 45,
    tipo: "guiado",
    entrena: "Muñecas y dedos sueltos",
    detalle: "Abre las manos con los dedos separados 3 s, cierra el puño 1 s, y repite 10 veces. Sin teclear.",
    disponible: true,
  },
  arana: {
    id: "arana",
    nombre: "Araña",
    segundos: 30,
    tipo: "guiado",
    entrena: "Independencia de dedos",
    detalle: "Manos planas sobre la mesa. Levanta cada dedo en orden y vuelve a apoyarlo.",
    disponible: true,
  },
  escala: {
    id: "escala",
    nombre: "Escala del teclado",
    segundos: 30,
    tipo: "texto",
    entrena: "Precisión lenta",
    detalle: "El alfabeto de ida y vuelta, despacio. Meta: cero errores.",
    disponible: true,
  },
  "fila-base": {
    id: "fila-base",
    nombre: "Fila base lenta",
    segundos: 60,
    tipo: "texto",
    entrena: "Posición de manos",
    detalle: "Combinaciones de la fila base al 60% de tu velocidad. Meta: 100% de precisión.",
    fantasma: 0.6,
    disponible: true,
  },
  alternancia: {
    id: "alternancia",
    nombre: "Alternancia de manos",
    segundos: 60,
    tipo: "texto",
    entrena: "Solapamiento entre manos",
    detalle: "Palabras que alternan mano izquierda y derecha.",
    disponible: false,
  },
  pares: {
    id: "pares",
    nombre: "Pares débiles",
    segundos: 60,
    tipo: "texto",
    entrena: "Tus puntos lentos",
    detalle: "Texto con tus pares de letras más lentos, a ritmo tranquilo.",
    disponible: false,
  },
  lento: {
    id: "lento",
    nombre: "Texto lento",
    segundos: 60,
    tipo: "texto",
    entrena: "Ritmo constante",
    detalle: "Frase corrida al 80% de tu velocidad media. Meta: cero errores.",
    fantasma: 0.8,
    disponible: true,
  },
  escalera: {
    id: "escalera",
    nombre: "Escalera de palabras",
    segundos: 90,
    tipo: "texto",
    entrena: "Fluidez creciente",
    detalle: "Cada palabra se repite 5 veces y la siguiente tiene una letra más.",
    disponible: false,
  },
  metronomo: {
    id: "metronomo",
    nombre: "Metrónomo",
    segundos: 60,
    tipo: "texto",
    entrena: "Ritmo parejo",
    detalle: "Teclea una frase al compás de un pulso.",
    disponible: false,
  },
};

export const RUTINAS: Record<Rutina, IdEjercicio[]> = {
  rapida: ["manos", "escala", "fila-base", "lento"],
  estandar: ["manos", "arana", "escala", "fila-base", "alternancia", "pares", "lento"],
  completa: ["manos", "arana", "escala", "fila-base", "alternancia", "pares", "lento", "escalera", "metronomo"],
};

/** Pausa entre ejercicios de una rutina (segundos). */
export const PAUSA_ENTRE_EJERCICIOS = 3;
/** wpm usado para el cursor fantasma si aún no hay tests. */
export const WPM_INICIAL = 46;

/** Ejercicios de una rutina que se pueden hacer ya. */
export function ejerciciosDeRutina(rutina: Rutina): Ejercicio[] {
  return RUTINAS[rutina].map((id) => EJERCICIOS[id]).filter((e) => e.disponible);
}

export function duracionRutina(rutina: Rutina): number {
  return RUTINAS[rutina].reduce((s, id) => s + EJERCICIOS[id].segundos, 0);
}

// ---------- Ejercicios guiados ----------

export interface PasoGuiado {
  titulo: string;
  detalle: string;
  /** 0..1 dentro de la fase actual (para pintar un anillo o barra). */
  progreso: number;
}

const PREPARACION_MANOS = 5;
const CICLO_MANOS = 4; // 3 s abiertas + 1 s de puño
const REPETICIONES_MANOS = 10;

const DEDOS_ARANA = [
  "pulgar izquierdo",
  "índice izquierdo",
  "corazón izquierdo",
  "anular izquierdo",
  "meñique izquierdo",
  "meñique derecho",
  "anular derecho",
  "corazón derecho",
  "índice derecho",
  "pulgar derecho",
];
const SEGUNDOS_POR_DEDO = 3;

/** Qué toca hacer a los `t` segundos de un ejercicio guiado. */
export function pasoGuiado(id: "manos" | "arana", t: number): PasoGuiado {
  if (id === "manos") {
    if (t < PREPARACION_MANOS) {
      return { titulo: "Prepara las manos", detalle: "Apóyalas sobre la mesa, relajadas.", progreso: t / PREPARACION_MANOS };
    }
    const u = t - PREPARACION_MANOS;
    const rep = Math.min(REPETICIONES_MANOS, Math.floor(u / CICLO_MANOS) + 1);
    const dentro = u % CICLO_MANOS;
    if (u >= REPETICIONES_MANOS * CICLO_MANOS) {
      return { titulo: "Listo", detalle: "Sacude las manos un momento.", progreso: 1 };
    }
    return dentro < 3
      ? { titulo: `Abre y separa los dedos (${rep}/${REPETICIONES_MANOS})`, detalle: "Mantén 3 segundos.", progreso: dentro / 3 }
      : { titulo: `Cierra el puño (${rep}/${REPETICIONES_MANOS})`, detalle: "1 segundo.", progreso: dentro - 3 };
  }
  const i = Math.min(DEDOS_ARANA.length - 1, Math.floor(t / SEGUNDOS_POR_DEDO));
  return {
    titulo: `Levanta el ${DEDOS_ARANA[i]}`,
    detalle: `Dedo ${i + 1} de ${DEDOS_ARANA.length}. Vuelve a apoyarlo y sigue con el siguiente.`,
    progreso: (t % SEGUNDOS_POR_DEDO) / SEGUNDOS_POR_DEDO,
  };
}

// ---------- Ejercicios de texto ----------

const ABECEDARIO = "abcdefghijklmnñopqrstuvwxyz";
const FILA_BASE = "asdfjklñ";

function alReves(s: string): string {
  return [...s].reverse().join("");
}

/** Palabras de un ejercicio de texto. Determinista por semilla.
 * Solo los ejercicios `disponible` tienen generador. */
export function textoEjercicio(id: IdEjercicio, seed: number, opciones: { puntuacion: boolean }): string[] {
  switch (id) {
    case "escala":
      return [ABECEDARIO, alReves(ABECEDARIO), ABECEDARIO, alReves(ABECEDARIO)];
    case "fila-base": {
      const rng = mulberry32(seed);
      const palabras: string[] = [];
      for (let i = 0; i < 120; i++) {
        const largo = 3 + Math.floor(rng() * 3);
        let w = "";
        for (let k = 0; k < largo; k++) {
          let c = FILA_BASE[Math.floor(rng() * FILA_BASE.length)];
          if (k > 0 && c === w[k - 1]) c = FILA_BASE[(FILA_BASE.indexOf(c) + 1) % FILA_BASE.length];
          w += c;
        }
        palabras.push(w);
      }
      return palabras;
    }
    case "lento":
      return palabrasDelBanco(seed, { puntuacion: opciones.puntuacion, minPalabras: 150 });
    default:
      throw new Error(`El ejercicio ${id} aún no tiene generador de texto`);
  }
}

/** wpm al que avanza el cursor fantasma: el wpm medio × el porcentaje del ejercicio. */
export function wpmFantasma(id: IdEjercicio, wpmMedio: number | null): number | null {
  const porcentaje = EJERCICIOS[id].fantasma;
  if (porcentaje === undefined) return null;
  return (wpmMedio ?? WPM_INICIAL) * porcentaje;
}

/** Posición (índice de carácter en el texto con espacios) del cursor fantasma. */
export function posicionFantasma(wpm: number, segundos: number): number {
  return Math.floor((wpm * 5 * segundos) / 60);
}

/** Convierte una posición en el texto corrido en (palabra, letra). Si cae en un
 * espacio se asigna a la última letra de la palabra anterior. */
export function ubicarEnPalabras(palabras: readonly string[], pos: number): { palabra: number; letra: number } | null {
  if (palabras.length === 0 || pos < 0) return null;
  let resto = pos;
  for (let i = 0; i < palabras.length; i++) {
    const largo = palabras[i].length;
    if (resto < largo) return { palabra: i, letra: resto };
    if (resto === largo) return { palabra: i, letra: Math.max(0, largo - 1) };
    resto -= largo + 1;
  }
  return null;
}
