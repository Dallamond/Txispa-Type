// Motor de tecleo por palabras. Lógica pura: el componente solo pinta.
//
// Convenciones heredadas de Shellpath (no cambiar sin avisar a Lucas):
// - Se avanza por palabras: el espacio cierra la palabra y no se vuelve atrás.
//   Dentro de la palabra en curso sí se puede borrar.
// - Borrar NO devuelve el fallo ya contado.
// - Las letras que faltan al cerrar con espacio cuentan como fallos.
// - El espacio de cierre cuenta como pulsación correcta.
// - El cronómetro arranca con la primera pulsación, no al cargar el texto.
// - Máximo EXTRA_MAX letras de más por palabra, para no reventar la maquetación.
//
// Modo estricto (decisión de Txispa Type): una letra equivocada cuenta como fallo
// pero no entra en la palabra, y el espacio no cierra una palabra incompleta.

import {
  acumuladorVacio,
  congelar,
  cortarCadena,
  registrarFaltas,
  registrarPulsacion,
  type Acumulador,
} from "./agregados";
import { calcularMedidas, type Medidas } from "./medidas";

/** Tope de letras de más que se aceptan en una palabra. */
export const EXTRA_MAX = 8;

export type ResultadoTecla =
  | "ignorada"
  | "ok"
  | "fallo"
  | "retroceso"
  | "cierra"
  | "cierraConFaltas";

export class MotorTecleo {
  readonly palabras: readonly string[];
  readonly estricto: boolean;
  idx = 0;
  tecleadas: string[] = [];
  correct = 0;
  errors = 0;
  /** Marca de tiempo (ms) de la primera pulsación, o null si aún no ha empezado. */
  inicio: number | null = null;
  readonly ac: Acumulador = acumuladorVacio();

  constructor(palabras: readonly string[], estricto = false) {
    this.palabras = palabras;
    this.estricto = estricto;
  }

  /** Se acabó el texto: no se admiten más pulsaciones. */
  get agotado(): boolean {
    return this.idx >= this.palabras.length;
  }

  get palabraActual(): string {
    return this.palabras[this.idx] ?? "";
  }

  get tecleadaActual(): string {
    return this.tecleadas[this.idx] ?? "";
  }

  /** Carácter que toca ahora (el espacio si la palabra está completa), o null si no hay texto. */
  get siguienteCaracter(): string | null {
    if (this.agotado) return null;
    const objetivo = this.palabraActual;
    const cur = this.tecleadaActual;
    return cur.length >= objetivo.length ? " " : objetivo[cur.length];
  }

  /** Segundos reales desde la primera pulsación (0 si no ha empezado). */
  segundosReales(ts: number): number {
    return this.inicio === null ? 0 : (ts - this.inicio) / 1000;
  }

  /** Procesa una pulsación (`key` es `KeyboardEvent.key`). `ts` en milisegundos. */
  tecla(key: string, ts: number): ResultadoTecla {
    if (this.agotado) return "ignorada";
    const objetivo = this.palabraActual;
    const cur = this.tecleadaActual;

    if (key === "Backspace") {
      if (cur.length === 0) return "ignorada";
      this.arranca(ts);
      this.tecleadas[this.idx] = cur.slice(0, -1);
      cortarCadena(this.ac, ts);
      return "retroceso";
    }

    if (key.length !== 1) return "ignorada";

    if (key === " ") {
      if (cur.length === 0) return "ignorada"; // espacio al aire: no salta la palabra
      if (this.estricto && cur.length < objetivo.length) return "ignorada";
      this.arranca(ts);
      const faltan = Math.max(0, objetivo.length - cur.length);
      if (faltan > 0) {
        this.errors += faltan;
        registrarFaltas(this.ac, objetivo.slice(cur.length));
      }
      registrarPulsacion(this.ac, " ", " ", ts);
      this.correct += 1;
      this.idx += 1;
      return faltan > 0 ? "cierraConFaltas" : "cierra";
    }

    if (cur.length >= objetivo.length + EXTRA_MAX) return "ignorada";
    this.arranca(ts);

    if (cur.length >= objetivo.length) {
      // Letra de más: error sin tecla esperada, así que sin confusión.
      this.errors += 1;
      cortarCadena(this.ac, ts);
      if (!this.estricto) this.tecleadas[this.idx] = cur + key;
      return "fallo";
    }

    const ok = registrarPulsacion(this.ac, objetivo[cur.length], key, ts);
    if (ok) {
      this.correct += 1;
      this.tecleadas[this.idx] = cur + key;
      return "ok";
    }
    this.errors += 1;
    if (!this.estricto) this.tecleadas[this.idx] = cur + key;
    return "fallo";
  }

  private arranca(ts: number): void {
    if (this.inicio === null) this.inicio = ts;
  }

  /** Medidas del intento hasta `ts`, limitadas a `durationSec`. */
  medidas(ts: number, durationSec: number): Medidas {
    return calcularMedidas({
      correct: this.correct,
      errors: this.errors,
      realSec: this.segundosReales(ts),
      durationSec,
      intervalos: this.ac.intervalos,
    });
  }

  agregados() {
    return congelar(this.ac);
  }
}
