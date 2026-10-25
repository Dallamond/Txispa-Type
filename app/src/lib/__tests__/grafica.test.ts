import { describe, it, expect } from "vitest";
import { dominioY, indicesEjeX } from "../grafica";

describe("dominioY", () => {
  it("wpm: deja margen por debajo y por encima", () => {
    const { lo, hi } = dominioY([40, 50, 60], "wpm");
    expect(lo).toBeLessThan(40);
    expect(hi).toBeGreaterThan(60);
  });

  it("wpm: nunca baja de 0 y el techo es mayor que el suelo", () => {
    const { lo, hi } = dominioY([2, 2, 2], "wpm");
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeGreaterThan(lo);
  });

  it("acc: el techo es 100", () => {
    expect(dominioY([94, 96, 97], "acc").hi).toBe(100);
  });
});

describe("indicesEjeX", () => {
  it("sin datos no hay etiquetas", () => {
    expect(indicesEjeX(0)).toEqual([]);
  });

  it("incluye siempre el último punto", () => {
    for (const n of [1, 2, 5, 6, 7, 30, 100]) {
      const idx = indicesEjeX(n);
      expect(idx[idx.length - 1]).toBe(n - 1);
    }
  });

  it("como mucho siete etiquetas y en orden creciente sin repetir", () => {
    for (const n of [1, 10, 30, 100, 500]) {
      const idx = indicesEjeX(n);
      expect(idx.length).toBeLessThanOrEqual(7);
      expect(idx).toEqual([...new Set(idx)].sort((a, b) => a - b));
    }
  });
});
