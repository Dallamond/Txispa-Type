import { describe, expect, it } from "vitest";
import { CLAVE_CALENTAMIENTO, CLAVE_TIEMPO_EXTRA, leerPulsacionesCalentamiento, leerTiempoExtra, sumarPulsacionesCalentamiento, sumarTiempoExtra } from "../contador";
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

describe("tiempo extra del día (sesiones sin terminar)", () => {
  const HOY = "2026-10-27";
  const AYER = "2026-10-26";
  it("empieza en 0 y acumula en el día", () => {
    const a = almacenFalso();
    expect(leerTiempoExtra(a, HOY)).toBe(0);
    expect(sumarTiempoExtra(a, HOY, 45)).toBe(45);
    expect(sumarTiempoExtra(a, HOY, 20)).toBe(65);
    expect(leerTiempoExtra(a, HOY)).toBe(65);
  });
  it("cambia el día, se reinicia", () => {
    const a = almacenFalso();
    sumarTiempoExtra(a, AYER, 300);
    expect(leerTiempoExtra(a, HOY)).toBe(0);
    expect(sumarTiempoExtra(a, HOY, 10)).toBe(10);
  });
  it("trunca a segundos enteros e ignora negativos", () => {
    const a = almacenFalso();
    expect(sumarTiempoExtra(a, HOY, 1.9)).toBe(1);
    expect(sumarTiempoExtra(a, HOY, -5)).toBe(1);
  });
  it("ignora archivos rotos", () => {
    expect(leerTiempoExtra(almacenFalso({ [CLAVE_TIEMPO_EXTRA]: "{no" }), HOY)).toBe(0);
    expect(leerTiempoExtra(almacenFalso({ [CLAVE_TIEMPO_EXTRA]: JSON.stringify({ dia: HOY, segundos: -8 }) }), HOY)).toBe(0);
  });
  it("sin almacén no lanza", () => {
    expect(leerTiempoExtra(null, HOY)).toBe(0);
    expect(sumarTiempoExtra(null, HOY, 30)).toBe(30);
  });
});
