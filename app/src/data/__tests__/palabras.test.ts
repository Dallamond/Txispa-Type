import { describe, expect, it } from "vitest";
import { CHARMAP } from "../keyboard";
import { PALABRAS } from "../palabras";

const cuenta = (letra: string) => PALABRAS.filter((p) => p.includes(letra)).length;

describe("PALABRAS", () => {
  it("tiene entre 1400 y 1700 palabras", () => {
    expect(PALABRAS.length).toBeGreaterThanOrEqual(1400);
    expect(PALABRAS.length).toBeLessThanOrEqual(1700);
  });

  it("no tiene duplicados", () => {
    expect(new Set(PALABRAS).size).toBe(PALABRAS.length);
  });

  it("está toda en minúscula, sin espacios ni signos", () => {
    for (const p of PALABRAS) {
      expect(p, p).toBe(p.toLowerCase());
      expect(p, p).toMatch(/^[a-zñáéíóúü]+$/);
    }
  });

  it("solo usa caracteres tecleables en el teclado ISO español", () => {
    for (const p of PALABRAS) {
      for (const c of p) expect(CHARMAP[c], `${p}: ${c}`).toBeDefined();
    }
  });

  it("tiene entre 2 y 12 letras por palabra", () => {
    for (const p of PALABRAS) {
      expect(p.length, p).toBeGreaterThanOrEqual(2);
      expect(p.length, p).toBeLessThanOrEqual(12);
    }
  });

  it("cubre las teclas débiles con material suficiente", () => {
    expect(cuenta("v")).toBeGreaterThanOrEqual(120);
    expect(cuenta("x")).toBeGreaterThanOrEqual(40);
    expect(cuenta("u")).toBeGreaterThanOrEqual(250);
    expect(cuenta("y")).toBeGreaterThanOrEqual(100);
    expect(cuenta("b")).toBeGreaterThanOrEqual(150);
  });
});
