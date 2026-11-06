// Motor de tecleo de código para las lecciones del curso. Lógica pura: el componente solo pinta.
//
// Mismo contrato de medición que `MotorTecleo` (motor.ts), con estas diferencias:
// - Un token se cierra con espacio o con Enter según toque (`Token.cierre`), y el cierre cuenta
//   como pulsación correcta. Cerrar con el otro es un fallo y no avanza.
// - El último token no tiene cierre: la lección termina al dejarlo escrito correctamente.
// - La sangría no se teclea: la pone la vista.
// - Modo estricto: la letra equivocada cuenta como fallo pero no entra, y el cierre no vale con
//   el token incompleto (igual que en MotorTecleo).

import {
  acumuladorVacio,
  congelar,
  cortarCadena,
  registrarFaltas,
  registrarPulsacion,
  type Acumulador,
} from "./agregados";
import type { Token } from "./curso";
import { calcularMedidas, type Medidas } from "./medidas";
import { EXTRA_MAX, type ResultadoTecla } from "./motor";

export class MotorCodigo {
  readonly tokens: readonly Token[];
  readonly estricto: boolean;
  /** Texto de cada token, para reutilizar las funciones de estado de carácter. */
  readonly palabras: readonly string[];
  idx = 0;
  tecleadas: string[] = [];
  correct = 0;
  errors = 0;
  /** Marca de tiempo (ms) de la primera pulsación, o null si aún no ha empezado. */
  inicio: number | null = null;
  readonly ac: Acumulador = acumuladorVacio();

  constructor(tokens: readonly Token[], estricto = false) {
    this.tokens = tokens;
    this.estricto = estricto;
    this.palabras = tokens.map((t) => t.texto);
  }

  /** La lección está completa: no se admiten más pulsaciones. */
  get agotado(): boolean {
    return this.idx >= this.tokens.length;
  }

  get tecleadaActual(): string {
    return this.tecleadas[this.idx] ?? "";
  }

  /** Carácter que toca ahora ("\n" al cerrar una línea), o null si no hay nada que pulsar. */
  get siguienteCaracter(): string | null {
    if (this.agotado) return null;
    const { texto, cierre } = this.tokens[this.idx];
    const cur = this.tecleadaActual;
    return cur.length >= texto.length ? cierre || null : texto[cur.length];
  }

  /** Segundos reales desde la primera pulsación (0 si no ha empezado). */
  segundosReales(ts: number): number {
    return this.inicio === null ? 0 : (ts - this.inicio) / 1000;
  }

  /** Procesa una pulsación (`key` es `KeyboardEvent.key`). `ts` en milisegundos. */
  tecla(key: string, ts: number): ResultadoTecla {
    if (this.agotado) return "ignorada";
    if (key === "Enter") key = "\n";
    const cur = this.tecleadaActual;

    if (key === "Backspace") {
      if (cur.length === 0) return "ignorada";
      this.arranca(ts);
      this.tecleadas[this.idx] = cur.slice(0, -1);
      cortarCadena(this.ac, ts);
      this.comprobarFin();
      return "retroceso";
    }

    if (key.length !== 1) return "ignorada";
    return key === " " || key === "\n" ? this.cerrar(key, ts) : this.letra(key, ts);
  }

  private cerrar(key: string, ts: number): ResultadoTecla {
    const { texto, cierre } = this.tokens[this.idx];
    const cur = this.tecleadaActual;
    if (cur.length === 0) return "ignorada"; // cierre al aire: no salta el token
    if (this.estricto && cur.length < texto.length) return "ignorada";
    this.arranca(ts);

    if (key !== cierre) {
      // Cierre equivocado: espacio donde va Enter, Enter donde va espacio, o cierre en el último token.
      const esperado = cur.length < texto.length ? texto[cur.length] : cierre;
      if (esperado === "") cortarCadena(this.ac, ts);
      else registrarPulsacion(this.ac, esperado, key, ts);
      this.errors += 1;
      return "fallo";
    }

    const faltan = Math.max(0, texto.length - cur.length);
    if (faltan > 0) {
      this.errors += faltan;
      registrarFaltas(this.ac, texto.slice(cur.length));
    }
    registrarPulsacion(this.ac, cierre, key, ts);
    this.correct += 1;
    this.idx += 1;
    return faltan > 0 ? "cierraConFaltas" : "cierra";
  }

  private letra(key: string, ts: number): ResultadoTecla {
    const { texto } = this.tokens[this.idx];
    const cur = this.tecleadaActual;
    if (cur.length >= texto.length + EXTRA_MAX) return "ignorada";
    this.arranca(ts);

    if (cur.length >= texto.length) {
      // Letra de más: error sin tecla esperada, así que sin confusión.
      this.errors += 1;
      cortarCadena(this.ac, ts);
      if (!this.estricto) this.tecleadas[this.idx] = cur + key;
      return "fallo";
    }

    if (registrarPulsacion(this.ac, texto[cur.length], key, ts)) {
      this.correct += 1;
      this.tecleadas[this.idx] = cur + key;
      this.comprobarFin();
      return "ok";
    }
    this.errors += 1;
    if (!this.estricto) this.tecleadas[this.idx] = cur + key;
    return "fallo";
  }

  /** El último token no se cierra con una tecla: la lección acaba al dejarlo bien escrito. */
  private comprobarFin(): void {
    const t = this.tokens[this.idx];
    if (t && t.cierre === "" && this.tecleadaActual === t.texto) this.idx += 1;
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
