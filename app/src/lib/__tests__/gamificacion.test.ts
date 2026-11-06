import { describe, expect, it } from "vitest";
import { intentoDePrueba } from "./ayudas";
import { desgloseXp, multiplicadorPrecision, nivelDe, xpParaNivel, xpTotal } from "../xp";
import { ESCALONES, fraccionVelocimetro, simil } from "../simil";
import { LOGROS, logrosNuevos, rachaMaxima } from "../logros";

const t = (id: string, date: string, extra = {}) => intentoDePrueba(id, date, extra);

describe("xp", () => {
  it("la precisión escala el XP", () => {
    expect(multiplicadorPrecision(90)).toBe(0.5);
    expect(multiplicadorPrecision(94)).toBe(0.8);
    expect(multiplicadorPrecision(96)).toBe(1);
    expect(multiplicadorPrecision(99)).toBe(1.5);
  });

  it("base = caracteres/10 por multiplicador, sin bonus si no hay récord", () => {
    const d = desgloseXp(t("a", "2026-10-01T10:00:00Z", { correct: 250, acc: 96 }), []);
    expect(d.base).toBe(25);
    expect(d.bonusRecord).toBe(0); // sin historial no hay récord que batir
    expect(d.total).toBe(25);
  });

  it("récord solo con precisión digna y solo en tests", () => {
    const previo = [t("p", "2026-10-01T10:00:00Z", { wpm: 50, acc: 97 })];
    expect(desgloseXp(t("n", "2026-10-02T10:00:00Z", { wpm: 55, acc: 96 }), previo).bonusRecord).toBe(50);
    expect(desgloseXp(t("n", "2026-10-02T10:00:00Z", { wpm: 55, acc: 90 }), previo).bonusRecord).toBe(0);
    expect(desgloseXp(t("n", "2026-10-02T10:00:00Z", { wpm: 55, acc: 96, modo: "entreno" }), previo).bonusRecord).toBe(0);
  });

  it("bonus limpio exige 0 errores y caracteres suficientes", () => {
    expect(desgloseXp(t("a", "2026-10-01T10:00:00Z", { errors: 0, correct: 200, acc: 100 }), []).bonusLimpio).toBe(20);
    expect(desgloseXp(t("a", "2026-10-01T10:00:00Z", { errors: 0, correct: 50, acc: 100 }), []).bonusLimpio).toBe(0);
  });

  it("xpTotal es independiente del orden de entrada", () => {
    const a = t("a", "2026-10-01T10:00:00Z", { wpm: 40 });
    const b = t("b", "2026-10-02T10:00:00Z", { wpm: 60 });
    expect(xpTotal([b, a])).toBe(xpTotal([a, b]));
    expect(xpTotal([])).toBe(0);
  });
});

describe("niveles", () => {
  it("nivel 1 con 0 XP y crece de forma monótona", () => {
    expect(nivelDe(0).nivel).toBe(1);
    expect(xpParaNivel(2)).toBe(100);
    for (let n = 1; n < 60; n++) expect(xpParaNivel(n + 1)).toBeGreaterThan(xpParaNivel(n));
  });
  it("sube de nivel justo en el umbral y la fracción está en 0..1", () => {
    expect(nivelDe(99).nivel).toBe(1);
    expect(nivelDe(100).nivel).toBe(2);
    const n = nivelDe(150);
    expect(n.fraccion).toBeGreaterThan(0);
    expect(n.fraccion).toBeLessThan(1);
  });
  it("rango según nivel", () => {
    expect(nivelDe(0).rango).toBe("Aprendiz");
    expect(nivelDe(xpParaNivel(5)).rango).toBe("Dedos ágiles");
  });
});

describe("símil", () => {
  it("elige escalón por ppm", () => {
    expect(simil(10, 99).escalon.nombre).toBe("Caracol");
    expect(simil(46, 99).escalon.nombre).toBe("Caballo");
    expect(simil(200, 99).escalon.nombre).toBe("Cohete");
  });
  it("progreso y ppm que faltan hacia el siguiente", () => {
    const s = simil(45, 99);
    expect(s.siguiente?.nombre).toBe("Gacela");
    expect(s.progreso).toBeCloseTo(0.5);
    expect(s.faltan).toBe(5);
  });
  it("último escalón no tiene siguiente", () => {
    const s = simil(90, 99);
    expect(s.siguiente).toBeNull();
    expect(s.progreso).toBe(1);
  });
  it("frena con poca precisión", () => {
    expect(simil(60, 90).frenado).toBe(true);
    expect(simil(60, 96).frenado).toBe(false);
  });
  it("los escalones están ordenados y el velocímetro acota", () => {
    for (let i = 1; i < ESCALONES.length; i++) expect(ESCALONES[i].desde).toBeGreaterThan(ESCALONES[i - 1].desde);
    expect(fraccionVelocimetro(-5)).toBe(0);
    expect(fraccionVelocimetro(500)).toBe(1);
  });
});

describe("logros", () => {
  const ctx = { objetivoTests: 1 };
  it("ids únicos", () => {
    expect(new Set(LOGROS.map((l) => l.id)).size).toBe(LOGROS.length);
  });
  it("el primer test desbloquea 'primer-test'", () => {
    const nuevos = logrosNuevos([], t("a", "2026-10-01T10:00:00Z"), ctx).map((l) => l.id);
    expect(nuevos).toContain("primer-test");
  });
  it("un hito de ppm exige precisión digna", () => {
    const flojo = logrosNuevos([], t("a", "2026-10-01T10:00:00Z", { wpm: 62, acc: 90 }), ctx).map((l) => l.id);
    expect(flojo).not.toContain("ppm-60");
    const bueno = logrosNuevos([], t("a", "2026-10-01T10:00:00Z", { wpm: 62, acc: 97 }), ctx).map((l) => l.id);
    expect(bueno).toContain("ppm-60");
  });
  it("no repite logros ya desbloqueados", () => {
    const previos = [t("a", "2026-10-01T10:00:00Z")];
    const nuevos = logrosNuevos(previos, t("b", "2026-10-02T10:00:00Z"), ctx).map((l) => l.id);
    expect(nuevos).not.toContain("primer-test");
  });
  it("racha máxima cuenta días consecutivos", () => {
    const is = [t("a", "2026-10-01T10:00:00Z"), t("b", "2026-10-02T10:00:00Z"), t("c", "2026-10-03T10:00:00Z"), t("d", "2026-10-07T10:00:00Z")];
    expect(rachaMaxima(is, ctx)).toBe(3);
  });
});

import { comparacionDelDia } from "../delDia";

describe("comparación con el día", () => {
  const a = t("a", "2026-10-01T09:00:00Z", { wpm: 40 });
  const b = t("b", "2026-10-01T10:00:00Z", { wpm: 55 });
  const c = t("c", "2026-10-01T11:00:00Z", { wpm: 48 });
  const otroDia = t("z", "2026-09-30T11:00:00Z", { wpm: 99 });
  it("puesto, total y orden, ignorando otros días", () => {
    const r = comparacionDelDia([a, b, otroDia], c)!;
    expect(r.total).toBe(3);
    expect(r.puesto).toBe(2);
    expect(r.tests.map((x) => x.id)).toEqual(["a", "b", "c"]);
    expect(r.indice).toBe(2);
    expect(r.mejor).toBe(55);
    expect(r.esMejor).toBe(false);
  });
  it("no duplica el actual si ya está guardado", () => {
    expect(comparacionDelDia([a, b, c], c)!.total).toBe(3);
  });
  it("el más rápido del día y el primero del día", () => {
    expect(comparacionDelDia([a, c], b)!.esMejor).toBe(true);
    const solo = comparacionDelDia([], a)!;
    expect(solo.esMejor).toBe(false);
    expect(solo.mediaOtros).toBeNull();
  });
  it("un entreno no se compara", () => {
    expect(comparacionDelDia([a], t("e", "2026-10-01T12:00:00Z", { modo: "entreno" }))).toBeNull();
  });
});
