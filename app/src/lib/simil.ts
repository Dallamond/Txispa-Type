// Símil de velocidad: traduce los ppm a un "animal" para que el resultado se sienta.
// Si la precisión no llega al mínimo, la velocidad no cuenta como progreso y el símil
// se marca como "frenado": se ve el animal, pero avisa de que hay que bajar el ritmo.

import { PRECISION_MINIMA } from "./medidas";

export interface EscalonSimil {
  /** ppm mínimas para este escalón. */
  desde: number;
  nombre: string;
  /** "un" o "una", para "Vas como un caballo". */
  articulo: "un" | "una";
  emoji: string;
  frase: string;
}

export const ESCALONES: readonly EscalonSimil[] = [
  { desde: 0, nombre: "Caracol", articulo: "un", emoji: "🐌", frase: "Despacio y con buena letra: la base está ahí." },
  { desde: 20, nombre: "Tortuga", articulo: "una", emoji: "🐢", frase: "Paso firme. Cada día un poco más." },
  { desde: 30, nombre: "Conejo", articulo: "un", emoji: "🐇", frase: "Ya hay salto en esos dedos." },
  { desde: 40, nombre: "Caballo", articulo: "un", emoji: "🐎", frase: "Buen trote, ritmo de verdad." },
  { desde: 50, nombre: "Gacela", articulo: "una", emoji: "🦌", frase: "Ligero y elegante: velocidad con control." },
  { desde: 60, nombre: "Guepardo", articulo: "un", emoji: "🐆", frase: "Esto ya es velocidad de élite aficionada." },
  { desde: 70, nombre: "Halcón", articulo: "un", emoji: "🦅", frase: "En picado sobre el teclado." },
  { desde: 85, nombre: "Cohete", articulo: "un", emoji: "🚀", frase: "Fuera de escala." },
];

export interface Simil {
  escalon: EscalonSimil;
  /** Siguiente escalón, o null si ya es el último. */
  siguiente: EscalonSimil | null;
  /** 0..1 dentro del escalón actual hacia el siguiente (1 en el último). */
  progreso: number;
  /** ppm que faltan para el siguiente escalón (0 en el último). */
  faltan: number;
  /** true si la precisión está por debajo del mínimo. */
  frenado: boolean;
}

export function simil(wpm: number, acc: number): Simil {
  const w = Math.max(0, wpm);
  let idx = 0;
  for (let i = 0; i < ESCALONES.length; i++) if (w >= ESCALONES[i].desde) idx = i;
  const escalon = ESCALONES[idx];
  const siguiente = ESCALONES[idx + 1] ?? null;
  const progreso = siguiente ? Math.min(1, (w - escalon.desde) / (siguiente.desde - escalon.desde)) : 1;
  const faltan = siguiente ? Math.max(0, Math.ceil((siguiente.desde - w) * 10) / 10) : 0;
  return { escalon, siguiente, progreso, faltan, frenado: acc < PRECISION_MINIMA };
}

/** Fracción 0..1 de la aguja del velocímetro (tope en 90 ppm). */
export const PPM_MAX_VELOCIMETRO = 90;
export function fraccionVelocimetro(wpm: number): number {
  return Math.min(1, Math.max(0, wpm / PPM_MAX_VELOCIMETRO));
}
