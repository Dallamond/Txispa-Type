// Ranking público opt-in de MEJOR wpm en test. Lógica pura y contrato del almacén.
// Aquí `wpm` son palabras por minuto (la interfaz las llama "ppm"). Sin XP.
import { PRECISION_MINIMA } from "./medidas";
import { soloTests } from "./estadisticas";
import type { Intento } from "../types";

export interface FilaRanking {
  alias: string;
  /** Mejor wpm neta en un test con precisión >= PRECISION_MINIMA. */
  mejorWpm: number;
  /** Mejor precisión (%) entre los tests válidos. */
  accMejor: number;
  /** Número de tests del modo test (todos, no solo los válidos). */
  tests: number;
}

export interface RankingStore {
  /** Las `n` mejores filas, de mayor a menor wpm. */
  listar(n: number): Promise<FilaRanking[]>;
  /** Publica o actualiza el perfil del usuario actual. Falla si el alias es de otro. */
  publicar(perfil: FilaRanking): Promise<void>;
  /** Borra el perfil público del usuario actual y libera su alias. */
  retirar(): Promise<void>;
  /** `true` si el alias no lo usa otra persona (sin distinguir mayúsculas). */
  aliasLibre(alias: string): Promise<boolean>;
  /** Puesto (1 = el mejor) del usuario actual, o null si no está publicado. */
  miPuesto(): Promise<number | null>;
}

export const ALIAS_REGEX = /^[A-Za-z0-9_-]{3,20}$/;
export const TOP_RANKING = 50;

export interface ResultadoAlias {
  valido: boolean;
  /** Motivo en español si no es válido. */
  motivo: string | null;
}

export function validarAlias(alias: string): ResultadoAlias {
  if (alias.length < 3) return { valido: false, motivo: "Mínimo 3 caracteres." };
  if (alias.length > 20) return { valido: false, motivo: "Máximo 20 caracteres." };
  if (!ALIAS_REGEX.test(alias)) return { valido: false, motivo: "Solo letras sin tilde, números, guion y guion bajo." };
  return { valido: true, motivo: null };
}

/** Clave de unicidad del alias. */
export function aliasClave(alias: string): string {
  return alias.toLowerCase();
}

export type PerfilDerivado = Omit<FilaRanking, "alias">;

/** Deriva el perfil público de los intentos: solo tests; la mejor wpm exige precisión >= 95 %.
 * Devuelve null si no hay ningún test válido (no se puede publicar nada). */
export function perfilPublicoDesde(intentos: readonly Intento[]): PerfilDerivado | null {
  const tests = soloTests([...intentos]);
  const validos = tests.filter((t) => t.acc >= PRECISION_MINIMA);
  if (validos.length === 0) return null;
  return {
    mejorWpm: Math.max(...validos.map((t) => t.wpm)),
    accMejor: Math.max(...validos.map((t) => t.acc)),
    tests: tests.length,
  };
}

/** Orden del ranking: más wpm primero; a igualdad, más precisión; luego alias. */
export function compararFilas(a: FilaRanking, b: FilaRanking): number {
  return b.mejorWpm - a.mejorWpm || b.accMejor - a.accMejor || a.alias.localeCompare(b.alias);
}
