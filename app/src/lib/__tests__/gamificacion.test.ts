import { describe, expect, it } from "vitest";
import { intentoDePrueba } from "./ayudas";
import { desgloseXp, multiplicadorPrecision, nivelDe, xpParaNivel, xpTotal } from "../xp";
import { ESCALONES, fraccionVelocimetro, simil } from "../simil";
import { estadoDe, estadoLogros, LOGROS, logrosNuevos, mejorSeriePrecisa, nivelesDe, rachaMaxima, TIERS } from "../logros";

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

describe("logros por niveles", () => {
  const ctx = { objetivoTests: 1 };
  const logro = (id: string) => LOGROS.find((l) => l.id === id)!;

  it("ids únicos y metas crecientes con tiers suficientes", () => {
    expect(new Set(LOGROS.map((l) => l.id)).size).toBe(LOGROS.length);
    for (const l of LOGROS) {
      expect(l.metas.length).toBeLessThanOrEqual(TIERS.length);
      for (let i = 1; i < l.metas.length; i++) expect(l.metas[i]).toBeGreaterThan(l.metas[i - 1]);
      expect(nivelesDe(l)[0].tier).toBe("bronce");
    }
  });

  it("sin intentos no hay nivel y la fracción es 0", () => {
    for (const e of estadoLogros([], ctx)) {
      expect(e.alcanzados).toBe(0);
      expect(e.actual).toBeNull();
      expect(e.fraccion).toBe(0);
    }
  });

  it("la velocidad sube de nivel solo con precisión digna", () => {
    const flojo = estadoDe(logro("velocidad"), [t("a", "2026-10-01T10:00:00Z", { wpm: 60, acc: 90 })], ctx);
    expect(flojo.alcanzados).toBe(0);
    const bueno = estadoDe(logro("velocidad"), [t("a", "2026-10-01T10:00:00Z", { wpm: 50, acc: 97 })], ctx);
    expect(bueno.actual).toEqual({ tier: "plata", meta: 45 });
    expect(bueno.siguiente).toEqual({ tier: "oro", meta: 55 });
    expect(bueno.fraccion).toBeCloseTo(0.5); // (50-45)/(55-45)
  });

  it("al completar todos los niveles la fracción es 1", () => {
    const e = estadoDe(logro("velocidad"), [t("a", "2026-10-01T10:00:00Z", { wpm: 80, acc: 99 })], ctx);
    expect(e.completo).toBe(true);
    expect(e.siguiente).toBeNull();
    expect(e.actual?.tier).toBe("diamante");
    expect(e.fraccion).toBe(1);
  });

  it("logrosNuevos devuelve el mejor nivel nuevo por familia y no repite", () => {
    const primero = logrosNuevos([], t("a", "2026-10-01T10:00:00Z", { wpm: 50, acc: 97, errors: 0, correct: 250 }), ctx);
    const vel = primero.find((n) => n.logro.id === "velocidad");
    expect(vel?.nivel.tier).toBe("plata"); // salta bronce y plata de golpe: solo se anuncia el mejor
    expect(primero.find((n) => n.logro.id === "limpios")?.nivel.tier).toBe("bronce");
    const previos = [t("a", "2026-10-01T10:00:00Z", { wpm: 50, acc: 97 })];
    const segundo = logrosNuevos(previos, t("b", "2026-10-02T10:00:00Z", { wpm: 48, acc: 97 }), ctx);
    expect(segundo.find((n) => n.logro.id === "velocidad")).toBeUndefined();
  });

  it("racha máxima cuenta días consecutivos", () => {
    const is = [t("a", "2026-10-01T10:00:00Z"), t("b", "2026-10-02T10:00:00Z"), t("c", "2026-10-03T10:00:00Z"), t("d", "2026-10-07T10:00:00Z")];
    expect(rachaMaxima(is, ctx)).toBe(3);
  });

  it("serie precisa: se corta con un test de poca precisión", () => {
    const is = [
      t("a", "2026-10-01T10:00:00Z", { acc: 97 }),
      t("b", "2026-10-01T11:00:00Z", { acc: 96 }),
      t("c", "2026-10-01T12:00:00Z", { acc: 90 }),
      t("d", "2026-10-01T13:00:00Z", { acc: 98 }),
    ];
    expect(mejorSeriePrecisa(is)).toBe(2);
  });

  it("tiempo en horas y días distintos", () => {
    const is = [t("a", "2026-10-01T10:00:00Z", { elapsedSec: 1800 }), t("b", "2026-10-02T10:00:00Z", { elapsedSec: 1800 })];
    expect(estadoDe(logro("tiempo"), is, ctx).valor).toBeCloseTo(1);
    expect(estadoDe(logro("dias"), is, ctx).valor).toBe(2);
  });
});
