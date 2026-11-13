// El XP total se calcula en una sola pasada. Este test lo compara con la definición original
// (recorrer todos los intentos anteriores en cada paso), que es la referencia de cómo se reparte el XP.

import { describe, expect, it } from "vitest";
import type { Intento } from "../../types";
import { MODULOS_POR_CURSO, idLeccion } from "../../data/curso";
import { PRECISION_MINIMA } from "../medidas";
import { mulberry32 } from "../rng";
import { BONUS_DOMINADA, BONUS_LECCION, BONUS_LIMPIO, BONUS_MODULO, BONUS_RECORD, CARACTERES_POR_XP, MIN_CARACTERES_LIMPIO, desgloseXp, multiplicadorPrecision, xpTotal } from "../xp";
import { esLeccionSuperada, estadosGam, moduloCompleto, moduloDeLeccion } from "../gamCurso";
import { intentoDePrueba } from "./ayudas";

function mejorWpmDigno(intentos: readonly Intento[]): number | null {
  let mejor: number | null = null;
  for (const i of intentos) {
    if (i.modo !== "test" || i.acc < PRECISION_MINIMA) continue;
    if (mejor === null || i.wpm > mejor) mejor = i.wpm;
  }
  return mejor;
}

/** Definición original: cada intento mira a todos los anteriores. */
function desgloseReferencia(intento: Intento, previos: readonly Intento[]): number {
  const base = Math.round((intento.correct / CARACTERES_POR_XP) * multiplicadorPrecision(intento.acc));
  const mejor = mejorWpmDigno(previos);
  const record = intento.modo === "test" && intento.acc >= PRECISION_MINIMA && mejor !== null && intento.wpm > mejor ? BONUS_RECORD : 0;
  const limpio = intento.errors === 0 && intento.correct >= MIN_CARACTERES_LIMPIO ? BONUS_LIMPIO : 0;
  let curso = 0;
  if (esLeccionSuperada(intento)) {
    const id = intento.leccionId!;
    const antes = estadosGam(previos);
    const despues = estadosGam([...previos, intento]);
    const antesLeccion = antes.get(id) ?? "pendiente";
    if (antesLeccion === "pendiente") curso += BONUS_LECCION;
    if (antesLeccion !== "dominada" && despues.get(id) === "dominada") curso += BONUS_DOMINADA;
    const m = moduloDeLeccion(id);
    if (m && !moduloCompleto(m, antes) && moduloCompleto(m, despues)) curso += BONUS_MODULO;
  }
  return base + record + limpio + curso;
}

function historialAleatorio(semilla: number, n: number): Intento[] {
  const rng = mulberry32(semilla);
  const ids = [
    ...MODULOS_POR_CURSO.html[0].lecciones.map((l) => idLeccion(MODULOS_POR_CURSO.html[0], l)),
    ...MODULOS_POR_CURSO.linux[0].lecciones.map((l) => idLeccion(MODULOS_POR_CURSO.linux[0], l)),
    "html/L99.99", // una lección que ya no existe en el catálogo
  ];
  return Array.from({ length: n }, (_, k) => {
    const dia = String(1 + Math.floor(rng() * 12)).padStart(2, "0");
    const hora = String(Math.floor(rng() * 24)).padStart(2, "0");
    const minuto = String(k % 60).padStart(2, "0");
    const esCurso = rng() < 0.6;
    return intentoDePrueba(`i${semilla}-${k}`, `2026-11-${dia}T${hora}:${minuto}:00Z`, {
      modo: esCurso || rng() < 0.5 ? "entreno" : "test",
      fuente: esCurso ? "curso" : "banco",
      leccionId: esCurso ? ids[Math.floor(rng() * ids.length)] : undefined,
      acc: 88 + Math.floor(rng() * 13),
      wpm: 5 + Math.floor(rng() * 60),
      correct: Math.floor(rng() * 400),
      errors: rng() < 0.3 ? 0 : Math.floor(rng() * 20),
    });
  });
}

describe("XP en una pasada", () => {
  for (const semilla of [1, 2, 3, 4, 5]) {
    it(`da el mismo total y el mismo desglose que la definición original (semilla ${semilla})`, () => {
      const lista = historialAleatorio(semilla, 120);
      const orden = [...lista].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      let esperado = 0;
      orden.forEach((intento, k) => {
        const previos = orden.slice(0, k);
        const ref = desgloseReferencia(intento, previos);
        expect(desgloseXp(intento, previos).total, `intento ${k}`).toBe(ref);
        esperado += ref;
      });
      expect(xpTotal(lista)).toBe(esperado);
    });
  }

  it("con miles de intentos no se dispara el coste", () => {
    const lista = historialAleatorio(9, 6000);
    const t0 = performance.now();
    xpTotal(lista);
    expect(performance.now() - t0).toBeLessThan(1500);
  });
});
