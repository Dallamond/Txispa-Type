import { describe, it, expect } from "vitest";
import { mulberry32, newSeed, barajado } from "../rng";

describe("mulberry32", () => {
  it("es determinista: misma semilla, misma secuencia", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it("semillas distintas dan secuencias distintas", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(Array.from({ length: 10 }, () => a())).not.toEqual(Array.from({ length: 10 }, () => b()));
  });

  it("devuelve valores en [0, 1)", () => {
    const rng = mulberry32(999);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("newSeed", () => {
  it("devuelve un entero de 32 bits sin signo", () => {
    for (let i = 0; i < 50; i++) {
      const s = newSeed();
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe("barajado", () => {
  it("conserva los elementos y no muta el original", () => {
    const orig = [1, 2, 3, 4, 5, 6, 7, 8];
    const copia = [...orig];
    const out = barajado(orig, mulberry32(7));
    expect(orig).toEqual(copia);
    expect([...out].sort()).toEqual(copia);
  });

  it("es reproducible con la misma semilla", () => {
    const orig = Array.from({ length: 30 }, (_, i) => i);
    expect(barajado(orig, mulberry32(5))).toEqual(barajado(orig, mulberry32(5)));
  });
});
