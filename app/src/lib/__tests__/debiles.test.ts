import { describe, it, expect } from "vitest";
import { analizar, calorDeTeclas, idTecla, puntuacionDe, VENTANA_INTENTOS } from "../debiles";
import { intentoDePrueba } from "./ayudas";
import type { Intento, ParStat, TeclaStat } from "../../types";

function conTeclas(
  id: string,
  dia: number,
  teclas: Record<string, TeclaStat>,
  pares: Record<string, ParStat> = {}
): Intento {
  const fecha = new Date(Date.UTC(2026, 9, 1 + dia, 10)).toISOString();
  return intentoDePrueba(id, fecha, { teclas, pares });
}

/** Tecla con `n` pulsaciones, `e` errores y `msMedio` de latencia en todas ellas. */
const t = (n: number, e: number, msMedio: number): TeclaStat => ({ n, e, ms: msMedio * (n - e), msN: n - e });

describe("puntuacionDe", () => {
  it("10 × tasa de error + 1,5 × lentitud (solo si es más lenta que la media)", () => {
    expect(puntuacionDe(0.1, null)).toBeCloseTo(1);
    expect(puntuacionDe(0, 1.4)).toBeCloseTo(0.6);
    expect(puntuacionDe(0, 0.8)).toBe(0);
    expect(puntuacionDe(0.05, 1.2)).toBeCloseTo(0.8);
  });
});

describe("analizar: teclas", () => {
  it("sin datos y sin semillas no hay nada que evaluar", () => {
    const a = analizar([], { semillas: false });
    expect(a.teclas).toEqual([]);
    expect(a.debiles).toEqual([]);
    expect(a.intentosUsados).toBe(0);
  });

  it("sin datos propios entran las semillas de typing.com (v, x, u, y)", () => {
    const a = analizar([]);
    expect(a.debiles.map((d) => d.tecla)).toEqual(["v", "x", "u", "y"]);
    expect(a.debiles.every((d) => d.semilla)).toBe(true);
    expect(a.debiles[0].errRate).toBeCloseTo(0.17);
  });

  it("con 100 o más pulsaciones propias la semilla ya no se suma", () => {
    const a = analizar([conTeclas("a", 0, { v: t(120, 0, 150), a: t(120, 0, 150) })]);
    const v = a.teclas.find((x) => x.tecla === "v")!;
    expect(v.semilla).toBe(false);
    expect(v.errRate).toBe(0);
  });

  it("una tecla con muchos errores es débil", () => {
    const a = analizar(
      [conTeclas("a", 0, { b: t(100, 12, 150), a: t(100, 0, 150), c: t(100, 0, 150) })],
      { semillas: false }
    );
    expect(a.debiles[0].tecla).toBe("b");
    expect(a.debiles[0].errRate).toBeCloseTo(0.12);
  });

  it("una tecla lenta (sin errores) también puede ser débil", () => {
    const a = analizar(
      [conTeclas("a", 0, { g: t(60, 0, 300), a: t(300, 0, 100), s: t(300, 0, 100) })],
      { semillas: false }
    );
    const g = a.teclas.find((x) => x.tecla === "g")!;
    expect(g.latRel).toBeGreaterThan(1.4);
    expect(g.puntuacion).toBeGreaterThanOrEqual(0.15);
    expect(a.debiles.map((x) => x.tecla)).toContain("g");
  });

  it("menos de 20 pulsaciones no se evalúa", () => {
    const a = analizar([conTeclas("a", 0, { q: t(19, 10, 150), a: t(100, 0, 150) })], { semillas: false });
    expect(a.teclas.find((x) => x.tecla === "q")).toBeUndefined();
  });

  it("menos de 10 intervalos no se evalúa (sin semilla)", () => {
    const a = analizar([conTeclas("a", 0, { q: { n: 30, e: 20, ms: 900, msN: 6 }, a: t(100, 0, 150) })], { semillas: false });
    expect(a.teclas.find((x) => x.tecla === "q")).toBeUndefined();
  });

  it("normaliza por intento: un entreno lento no hace débiles a todas las teclas", () => {
    const lento = conTeclas("lento", 0, { a: t(100, 0, 400), s: t(100, 0, 400), d: t(100, 0, 400) });
    const rapido = conTeclas("rapido", 1, { a: t(100, 0, 100), s: t(100, 0, 100), d: t(100, 0, 100) });
    const a = analizar([lento, rapido], { semillas: false });
    expect(a.debiles).toEqual([]);
    for (const x of a.teclas) expect(x.latRel).toBeCloseTo(1);
  });

  it("solo cuenta la ventana de los últimos 30 intentos", () => {
    const lista: Intento[] = [];
    // 5 intentos antiguos con muchos fallos en "m", luego 30 limpios.
    for (let i = 0; i < 5; i++) lista.push(conTeclas(`viejo${i}`, i, { m: t(50, 25, 150), a: t(50, 0, 150) }));
    for (let i = 0; i < VENTANA_INTENTOS; i++) lista.push(conTeclas(`n${i}`, 10 + i, { m: t(50, 0, 150), a: t(50, 0, 150) }));
    const a = analizar(lista, { semillas: false });
    expect(a.intentosUsados).toBe(VENTANA_INTENTOS);
    expect(a.teclas.find((x) => x.tecla === "m")!.e).toBe(0);
  });

  it("devuelve como mucho 8 teclas débiles", () => {
    const teclas: Record<string, TeclaStat> = {};
    for (const c of "abcdefghijkl") teclas[c] = t(100, 20, 150);
    const a = analizar([conTeclas("a", 0, teclas)], { semillas: false });
    expect(a.debiles).toHaveLength(8);
  });
});

describe("analizar: pares", () => {
  const base = { a: t(200, 0, 150), b: t(200, 0, 150) };

  it("un par claramente más lento que la media es lento", () => {
    const a = analizar([conTeclas("a", 0, base, { "er": { n: 10, ms: 10 * 300 }, "al": { n: 20, ms: 20 * 150 } })], { semillas: false });
    expect(a.pares.map((p) => p.par)).toEqual(["er"]);
    expect(a.pares[0].latRel).toBeCloseTo(2);
    expect(a.pares[0].ms).toBeCloseTo(300);
  });

  it("menos de 6 repeticiones no cuenta", () => {
    const a = analizar([conTeclas("a", 0, base, { er: { n: 5, ms: 5 * 600 } })], { semillas: false });
    expect(a.pares).toEqual([]);
  });

  it("ordena de más a menos lento y recorta a 10", () => {
    const pares: Record<string, ParStat> = {};
    "abcdefghijkl".split("").forEach((c, i) => (pares[`${c}x`] = { n: 10, ms: 10 * (200 + i * 20) }));
    const a = analizar([conTeclas("a", 0, base, pares)], { semillas: false });
    expect(a.pares).toHaveLength(10);
    expect(a.pares[0].par).toBe("lx");
    for (let i = 1; i < a.pares.length; i++) expect(a.pares[i - 1].latRel).toBeGreaterThanOrEqual(a.pares[i].latRel);
  });
});

describe("mapa de calor", () => {
  it("idTecla resuelve tildes y espacio", () => {
    expect(idTecla("á")).toBe("a");
    expect(idTecla("ñ")).toBe("ñ");
    expect(idTecla("␣")).toBe("Space");
    expect(idTecla("€€")).toBeNull();
  });

  it("calorDeTeclas escala de 0 a 1 y satura", () => {
    const a = analizar([conTeclas("a", 0, { b: t(100, 50, 150), c: t(100, 0, 150), d: t(100, 0, 150) })], { semillas: false });
    const calor = calorDeTeclas(a);
    expect(calor["b"]).toBe(1);
    expect(calor["c"]).toBe(0);
  });
});
