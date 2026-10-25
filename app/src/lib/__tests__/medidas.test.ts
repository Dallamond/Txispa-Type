import { describe, it, expect } from "vitest";
import {
  calcularMedidas,
  consistencia,
  precision,
  redondear,
  segundosMedidos,
  wpmBruta,
  wpmNeta,
} from "../medidas";

describe("wpm", () => {
  it("250 caracteres correctos en un minuto son 50 ppm", () => {
    expect(wpmNeta(250, 60)).toBe(50);
  });

  it("la bruta cuenta también los errores", () => {
    expect(wpmBruta(250, 10, 60)).toBe(52);
  });

  it("en medio minuto se duplica la tasa", () => {
    expect(wpmNeta(125, 30)).toBe(50);
  });
});

describe("precision", () => {
  it("sin pulsaciones es 100", () => {
    expect(precision(0, 0)).toBe(100);
  });

  it("correct entre (correct + errors)", () => {
    expect(precision(96, 4)).toBe(96);
    expect(precision(0, 5)).toBe(0);
  });
});

describe("segundosMedidos", () => {
  it("no pasa de la duración", () => {
    expect(segundosMedidos(75, 60)).toBe(60);
  });

  it("mínimo 1 s", () => {
    expect(segundosMedidos(0, 60)).toBe(1);
    expect(segundosMedidos(0.2, 60)).toBe(1);
  });

  it("usa el real si es menor", () => {
    expect(segundosMedidos(30, 60)).toBe(30);
  });
});

describe("consistencia", () => {
  it("con pocos intervalos es null", () => {
    expect(consistencia([100, 100, 100])).toBeNull();
    expect(consistencia([])).toBeNull();
  });

  it("un ritmo perfecto da 100", () => {
    expect(consistencia(Array(30).fill(150))).toBe(100);
  });

  it("un ritmo muy irregular baja, y nunca sale de 0-100", () => {
    const irregular = Array.from({ length: 40 }, (_, i) => (i % 2 === 0 ? 20 : 1900));
    const c = consistencia(irregular)!;
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThan(60);
  });

  it("más variación, menos consistencia", () => {
    const poca = Array.from({ length: 40 }, (_, i) => 150 + (i % 2 ? 10 : -10));
    const mucha = Array.from({ length: 40 }, (_, i) => 150 + (i % 2 ? 80 : -80));
    expect(consistencia(poca)!).toBeGreaterThan(consistencia(mucha)!);
  });
});

describe("calcularMedidas", () => {
  it("redondea a un decimal", () => {
    const m = calcularMedidas({ correct: 251, errors: 9, realSec: 60, durationSec: 60, intervalos: [] });
    expect(m.wpm).toBe(50.2);
    expect(m.rawWpm).toBe(52);
    expect(m.acc).toBe(96.5);
    expect(m.consistency).toBeNull();
  });

  it("un test que acaba antes mide con el tiempo real", () => {
    const m = calcularMedidas({ correct: 100, errors: 0, realSec: 30, durationSec: 60, intervalos: [] });
    expect(m.elapsedSec).toBe(30);
    expect(m.wpm).toBe(40);
  });

  it("texto vacío: todo a cero y precisión 100", () => {
    const m = calcularMedidas({ correct: 0, errors: 0, realSec: 0, durationSec: 60, intervalos: [] });
    expect(m.wpm).toBe(0);
    expect(m.acc).toBe(100);
  });
});

describe("redondear", () => {
  it("respeta los decimales pedidos", () => {
    expect(redondear(1.2345)).toBe(1.2);
    expect(redondear(1.2345, 2)).toBe(1.23);
  });
});
