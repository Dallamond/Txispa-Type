// Agregados por intento: tiempo por tecla, por par de letras y confusiones.
// Reglas en docs/ESPECIFICACION-TECNICA.md §3. No se guardan pulsaciones sueltas
// con el texto del usuario: solo estos contadores.

import type { ParStat, TeclaStat } from "../types";
import { INTERVALO_MAX_MS, INTERVALO_MIN_MS } from "./medidas";

/** El espacio se guarda como "␣" para que las claves se lean bien. */
export const ESPACIO = "␣";

export interface Acumulador {
  teclas: Record<string, TeclaStat>;
  pares: Record<string, ParStat>;
  confusiones: Record<string, number>;
  /** Intervalos válidos (ms) entre pulsaciones correctas consecutivas. */
  intervalos: number[];
  /** Marca de tiempo de la última pulsación registrada (null si no hay o se cortó la cadena). */
  ultimoTs: number | null;
  /** Clave de la última pulsación si fue correcta; null si fue un fallo o se cortó la cadena. */
  ultimaCorrecta: string | null;
}

export function acumuladorVacio(): Acumulador {
  return { teclas: {}, pares: {}, confusiones: {}, intervalos: [], ultimoTs: null, ultimaCorrecta: null };
}

/** Clave de agregado de un carácter: minúscula, y el espacio como "␣". */
export function claveTecla(ch: string): string {
  return ch === " " ? ESPACIO : ch.toLowerCase();
}

/** ¿Cuenta para pares? Letras (con tildes y ñ), dígitos y espacio. Los signos no. */
function cuentaParaPar(clave: string): boolean {
  return clave === ESPACIO || /^[\p{L}\p{N}]$/u.test(clave);
}

function tecla(ac: Acumulador, clave: string): TeclaStat {
  return (ac.teclas[clave] ??= { n: 0, e: 0, ms: 0, msN: 0 });
}

/** Registra una pulsación hecha con el carácter `escrito` cuando se esperaba `esperado`.
 * `ts` son milisegundos (cualquier reloj monótono). */
export function registrarPulsacion(ac: Acumulador, esperado: string, escrito: string, ts: number): boolean {
  const clave = claveTecla(esperado);
  const ok = esperado === escrito;
  const st = tecla(ac, clave);
  st.n++;

  if (!ok) {
    st.e++;
    const conf = `${clave}>${claveTecla(escrito)}`;
    ac.confusiones[conf] = (ac.confusiones[conf] ?? 0) + 1;
    ac.ultimaCorrecta = null;
    ac.ultimoTs = ts;
    return false;
  }

  if (ac.ultimaCorrecta !== null && ac.ultimoTs !== null) {
    const gap = ts - ac.ultimoTs;
    if (gap >= INTERVALO_MIN_MS && gap <= INTERVALO_MAX_MS) {
      st.ms += gap;
      st.msN++;
      ac.intervalos.push(gap);
      if (cuentaParaPar(ac.ultimaCorrecta) && cuentaParaPar(clave)) {
        const par = (ac.pares[ac.ultimaCorrecta + clave] ??= { n: 0, ms: 0 });
        par.n++;
        par.ms += gap;
      }
    }
  }
  ac.ultimaCorrecta = clave;
  ac.ultimoTs = ts;
  return true;
}

/** Letras que faltaban al cerrar una palabra: cuentan como pulsaciones esperadas
 * falladas, sin confusión (no se escribió otra cosa). Corta la cadena de tiempos. */
export function registrarFaltas(ac: Acumulador, faltan: string): void {
  for (const ch of faltan) {
    const st = tecla(ac, claveTecla(ch));
    st.n++;
    st.e++;
  }
  if (faltan.length > 0) ac.ultimaCorrecta = null;
}

/** Retroceso: corta la cadena para que el tiempo de corregir no cuente como intervalo. */
export function cortarCadena(ac: Acumulador, ts: number): void {
  ac.ultimaCorrecta = null;
  ac.ultimoTs = ts;
}

/** Copia de los agregados para guardarlos en el intento. */
export function congelar(ac: Acumulador): Pick<Acumulador, "teclas" | "pares" | "confusiones"> {
  return {
    teclas: structuredClone(ac.teclas),
    pares: structuredClone(ac.pares),
    confusiones: structuredClone(ac.confusiones),
  };
}
