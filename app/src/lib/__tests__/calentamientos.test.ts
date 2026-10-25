import { describe, it, expect } from "vitest";
import {
  DURACIONES_CALENTAMIENTO,
  palabrasFilaBase,
  palabrasParaCalentar,
  posicionFantasma,
  pulsoInicial,
  textoCalentamiento,
  ubicarEnPalabras,
  wpmFantasmaCalentamiento,
} from "../calentamientos";
import { CHARMAP } from "../../data/keyboard";
import { analizar } from "../debiles";
import { fraccionAlternancia } from "../textos";
import { intentoDePrueba } from "./ayudas";

describe("calentamiento tecleado", () => {
  it("las duraciones elegibles van de menos a más", () => {
    expect([...DURACIONES_CALENTAMIENTO]).toEqual([2, 3, 5, 8, 10]);
  });

  it("hay palabras de sobra para el tiempo elegido y crecen con él", () => {
    expect(palabrasParaCalentar(120, 50)).toBeGreaterThan(120 / 60 * 50);
    expect(palabrasParaCalentar(600, 50)).toBeGreaterThan(palabrasParaCalentar(120, 50));
    expect(palabrasParaCalentar(120, null)).toBe(palabrasParaCalentar(120, 46));
  });

  it("la fila base solo usa asdfjklñ, sin repetir letra seguida, y es determinista", () => {
    const a = palabrasFilaBase(5, 100);
    expect(a).toEqual(palabrasFilaBase(5, 100));
    for (const w of a) {
      expect(w).toMatch(/^[asdfjklñ]{3,5}$/);
      expect(w).not.toMatch(/(.)\1/);
    }
  });

  it("el texto empieza por la fila base, sigue con alternancia y acaba con texto corrido", () => {
    const t = textoCalentamiento(180, 7, { puntuacion: true, wpmMedio: 50 });
    expect(t.length).toBeGreaterThanOrEqual(palabrasParaCalentar(180, 50) * 0.9);
    expect(t[0]).toMatch(/^[asdfjklñ]+$/);
    expect(t).toEqual(textoCalentamiento(180, 7, { puntuacion: true, wpmMedio: 50 }));
    // Todo se puede teclear con el teclado español.
    for (const w of t) for (const ch of w) expect(CHARMAP[ch]).toBeDefined();
  });

  it("la parte de alternancia solo tiene palabras que cambian de mano", () => {
    const t = textoCalentamiento(180, 7, { puntuacion: false, wpmMedio: 50 });
    const total = palabrasParaCalentar(180, 50);
    const inicio = Math.max(10, Math.round(total * 0.15));
    const alternancia = t.slice(inicio, inicio + Math.max(10, Math.round(total * 0.25)));
    for (const w of alternancia) expect(fraccionAlternancia(w)).toBeGreaterThanOrEqual(0.7);
  });

  it("con datos refuerza tus pares lentos", () => {
    const analisis = analizar(
      [intentoDePrueba("a", "2026-10-01T10:00:00Z", { teclas: { a: { n: 200, e: 0, ms: 30000, msN: 200 } }, pares: { er: { n: 20, ms: 20 * 400 } } })],
      { semillas: false }
    );
    const cuenta = (t: string[]) => t.filter((w) => w.includes("er")).length;
    const sin = textoCalentamiento(300, 5, { puntuacion: false, wpmMedio: 50 });
    const con = textoCalentamiento(300, 5, { puntuacion: false, wpmMedio: 50, analisis });
    expect(cuenta(con)).toBeGreaterThan(cuenta(sin));
  });
});

describe("cursor fantasma", () => {
  it("el fantasma del calentamiento va al 70% de tu media, o de 46 si no hay datos", () => {
    expect(wpmFantasmaCalentamiento(50)).toBeCloseTo(35);
    expect(wpmFantasmaCalentamiento(null)).toBeCloseTo(46 * 0.7);
  });

  it("el pulso inicial del metrónomo es el 70% de la media", () => {
    expect(pulsoInicial(50)).toBe(35);
    expect(pulsoInicial(null)).toBe(32);
  });

  it("60 ppm son 5 caracteres por segundo", () => {
    expect(posicionFantasma(60, 1)).toBe(5);
    expect(posicionFantasma(60, 10)).toBe(50);
  });

  it("ubicarEnPalabras cuenta el espacio entre palabras", () => {
    const p = ["ab", "cde"];
    expect(ubicarEnPalabras(p, 0)).toEqual({ palabra: 0, letra: 0 });
    expect(ubicarEnPalabras(p, 1)).toEqual({ palabra: 0, letra: 1 });
    expect(ubicarEnPalabras(p, 2)).toEqual({ palabra: 0, letra: 1 }); // el espacio
    expect(ubicarEnPalabras(p, 3)).toEqual({ palabra: 1, letra: 0 });
    expect(ubicarEnPalabras(p, 5)).toEqual({ palabra: 1, letra: 2 });
    expect(ubicarEnPalabras(p, 6)).toEqual({ palabra: 1, letra: 2 });
    expect(ubicarEnPalabras(p, 7)).toBeNull();
    expect(ubicarEnPalabras([], 0)).toBeNull();
  });
});
