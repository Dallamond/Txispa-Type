import { describe, expect, it } from "vitest";
import { CLAVE_CALENTAMIENTO, leerPulsacionesCalentamiento, sumarPulsacionesCalentamiento } from "../contador";
import type { AlmacenClaveValor } from "../ajustes";

function almacenFalso(inicial: Record<string, string> = {}): AlmacenClaveValor & { datos: Record<string, string> } {
  const datos = { ...inicial };
  return { datos, getItem: (k) => datos[k] ?? null, setItem: (k, v) => void (datos[k] = v) };
}

describe("contador de calentamientos", () => {
  it("empieza en 0 y acumula", () => {
    const a = almacenFalso();
    expect(leerPulsacionesCalentamiento(a)).toBe(0);
    expect(sumarPulsacionesCalentamiento(a, 120)).toBe(120);
    expect(sumarPulsacionesCalentamiento(a, 30)).toBe(150);
    expect(leerPulsacionesCalentamiento(a)).toBe(150);
  });
  it("ignora valores rotos y sumas negativas", () => {
    expect(leerPulsacionesCalentamiento(almacenFalso({ [CLAVE_CALENTAMIENTO]: "{no" }))).toBe(0);
    expect(leerPulsacionesCalentamiento(almacenFalso({ [CLAVE_CALENTAMIENTO]: "-5" }))).toBe(0);
    expect(sumarPulsacionesCalentamiento(almacenFalso(), -10)).toBe(0);
  });
  it("sin almacén no lanza", () => {
    expect(leerPulsacionesCalentamiento(null)).toBe(0);
    expect(sumarPulsacionesCalentamiento(null, 7)).toBe(7);
  });
});
