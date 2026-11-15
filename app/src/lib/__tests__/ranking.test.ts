import { describe, expect, it } from "vitest";
import { aliasClave, compararFilas, perfilPublicoDesde, validarAlias } from "../ranking";
import { intentoDePrueba } from "./ayudas";

describe("validarAlias", () => {
  it("acepta alias válidos", () => {
    for (const a of ["abc", "Lucas_99", "a-b-c", "x".repeat(20)]) expect(validarAlias(a).valido).toBe(true);
  });
  it("rechaza longitud y caracteres", () => {
    expect(validarAlias("ab").valido).toBe(false);
    expect(validarAlias("x".repeat(21)).valido).toBe(false);
    expect(validarAlias("con espacio").valido).toBe(false);
    expect(validarAlias("ñandú").valido).toBe(false);
    expect(validarAlias("a@b.c").valido).toBe(false);
    expect(validarAlias("ab").motivo).toMatch(/Mínimo/);
  });
  it("la clave de unicidad no distingue mayúsculas", () => {
    expect(aliasClave("LuCas")).toBe(aliasClave("lucas"));
  });
});

describe("perfilPublicoDesde", () => {
  it("sin tests válidos devuelve null", () => {
    expect(perfilPublicoDesde([])).toBeNull();
    expect(perfilPublicoDesde([intentoDePrueba("a", "2026-11-01T10:00:00Z", { modo: "entreno", wpm: 90 })])).toBeNull();
    expect(perfilPublicoDesde([intentoDePrueba("a", "2026-11-01T10:00:00Z", { wpm: 90, acc: 90 })])).toBeNull();
  });
  it("ignora entrenos y tests con precisión < 95 %", () => {
    const p = perfilPublicoDesde([
      intentoDePrueba("a", "2026-11-01T10:00:00Z", { wpm: 50, acc: 96 }),
      intentoDePrueba("b", "2026-11-02T10:00:00Z", { wpm: 80, acc: 94.9 }),
      intentoDePrueba("c", "2026-11-03T10:00:00Z", { wpm: 99, acc: 99, modo: "entreno" }),
      intentoDePrueba("d", "2026-11-04T10:00:00Z", { wpm: 60, acc: 95 }),
    ]);
    expect(p).toEqual({ mejorWpm: 60, accMejor: 96, tests: 3 });
  });
});

describe("compararFilas", () => {
  it("ordena por wpm, luego precisión, luego alias", () => {
    const f = [
      { alias: "b", mejorWpm: 60, accMejor: 97, tests: 1 },
      { alias: "a", mejorWpm: 60, accMejor: 97, tests: 1 },
      { alias: "c", mejorWpm: 60, accMejor: 99, tests: 1 },
      { alias: "d", mejorWpm: 70, accMejor: 95, tests: 1 },
    ].sort(compararFilas);
    expect(f.map((x) => x.alias)).toEqual(["d", "c", "a", "b"]);
  });
});
