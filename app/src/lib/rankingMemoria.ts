// Implementación en memoria de RankingStore: datos de ejemplo y latencia inyectable.
import { aliasClave, compararFilas, validarAlias, type FilaRanking, type RankingStore } from "./ranking";

export const FILAS_EJEMPLO: FilaRanking[] = [
  { alias: "Norte", mejorWpm: 78.4, accMejor: 98.1, tests: 120 },
  { alias: "teclaZ", mejorWpm: 71.2, accMejor: 97.5, tests: 64 },
  { alias: "ola_k", mejorWpm: 64, accMejor: 99.2, tests: 33 },
  { alias: "mecano-77", mejorWpm: 58.6, accMejor: 96.4, tests: 18 },
  { alias: "Pipa", mejorWpm: 49.9, accMejor: 95.2, tests: 7 },
];

export interface OpcionesMemoria {
  /** Filas iniciales de otros usuarios. */
  filas?: FilaRanking[];
  /** Espera simulada antes de cada operación (ms). Por defecto 0. */
  latenciaMs?: number;
  /** Si es true, toda operación falla (para probar el estado de error). */
  fallar?: boolean;
}

/** `mio` es la clave de alias del usuario actual (null si no está publicado). */
export class RankingMemoria implements RankingStore {
  private filas = new Map<string, FilaRanking>();
  private mio: string | null = null;
  latenciaMs: number;
  fallar: boolean;

  constructor(op: OpcionesMemoria = {}) {
    for (const f of op.filas ?? FILAS_EJEMPLO) this.filas.set(aliasClave(f.alias), { ...f });
    this.latenciaMs = op.latenciaMs ?? 0;
    this.fallar = op.fallar ?? false;
  }

  private async espera(): Promise<void> {
    if (this.latenciaMs > 0) await new Promise((r) => setTimeout(r, this.latenciaMs));
    if (this.fallar) throw new Error("Sin conexión con el ranking.");
  }

  private ordenadas(): FilaRanking[] {
    return [...this.filas.values()].sort(compararFilas);
  }

  async listar(n: number): Promise<FilaRanking[]> {
    await this.espera();
    return this.ordenadas()
      .slice(0, Math.max(0, n))
      .map((f) => ({ ...f }));
  }

  async publicar(perfil: FilaRanking): Promise<void> {
    await this.espera();
    const v = validarAlias(perfil.alias);
    if (!v.valido) throw new Error(v.motivo ?? "Alias no válido.");
    const clave = aliasClave(perfil.alias);
    if (this.filas.has(clave) && clave !== this.mio) throw new Error("Ese alias ya está en uso.");
    // Cambio de alias: se libera el anterior.
    if (this.mio && this.mio !== clave) this.filas.delete(this.mio);
    this.filas.set(clave, { ...perfil });
    this.mio = clave;
  }

  async retirar(): Promise<void> {
    await this.espera();
    if (this.mio) this.filas.delete(this.mio);
    this.mio = null;
  }

  async aliasLibre(alias: string): Promise<boolean> {
    await this.espera();
    const clave = aliasClave(alias);
    return !this.filas.has(clave) || clave === this.mio;
  }

  async miPuesto(): Promise<number | null> {
    await this.espera();
    if (!this.mio) return null;
    const i = this.ordenadas().findIndex((f) => aliasClave(f.alias) === this.mio);
    return i === -1 ? null : i + 1;
  }
}
