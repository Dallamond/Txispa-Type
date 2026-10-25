import { describe, it, expect } from "vitest";
import {
  EJERCICIOS,
  RUTINAS,
  duracionDisponible,
  duracionRutina,
  ejerciciosDeRutina,
  pasoGuiado,
  pulsoInicial,
  posicionFantasma,
  textoEjercicio,
  ubicarEnPalabras,
  wpmFantasma,
} from "../calentamientos";
import { CHARMAP } from "../../data/keyboard";
import { analizar } from "../debiles";
import { fraccionAlternancia } from "../textos";
import { intentoDePrueba } from "./ayudas";

describe("rutinas", () => {
  it("duran lo que dice la especificación", () => {
    expect(duracionRutina("rapida")).toBe(195);
    expect(duracionRutina("estandar")).toBe(345);
    expect(duracionRutina("completa")).toBe(495);
  });

  it("todos los ejercicios de las rutinas están disponibles", () => {
    for (const r of ["rapida", "estandar", "completa"] as const) {
      expect(ejerciciosDeRutina(r)).toHaveLength(RUTINAS[r].length);
    }
    expect(ejerciciosDeRutina("rapida").map((e) => e.id)).toEqual(["manos", "escala", "fila-base", "lento"]);
  });
});

describe("duracionDisponible", () => {
  it("solo cuenta lo que se hace de verdad, con las pausas de 3 s", () => {
    // manos 45 + escala 30 + fila base 60 + lento 60 = 195, más 4 pausas
    expect(duracionDisponible("rapida")).toBe(195 + 12);
    // con todos los ejercicios disponibles: la duración de la rutina más 3 s por ejercicio
    expect(duracionDisponible("estandar")).toBe(duracionRutina("estandar") + 3 * 7);
    expect(duracionDisponible("completa")).toBe(duracionRutina("completa") + 3 * 9);
  });
});

describe("pasoGuiado: manos", () => {
  it("empieza con una preparación", () => {
    expect(pasoGuiado("manos", 0).titulo).toBe("Prepara las manos");
  });

  it("abre 3 s y cierra 1 s, diez veces", () => {
    expect(pasoGuiado("manos", 5).titulo).toContain("Abre");
    expect(pasoGuiado("manos", 5).titulo).toContain("1/10");
    expect(pasoGuiado("manos", 7.9).titulo).toContain("Abre");
    expect(pasoGuiado("manos", 8).titulo).toContain("puño");
    expect(pasoGuiado("manos", 9).titulo).toContain("2/10");
    expect(pasoGuiado("manos", 5 + 39).titulo).toContain("10/10");
  });

  it("termina con Listo", () => {
    expect(pasoGuiado("manos", 45).titulo).toBe("Listo");
  });

  it("el progreso siempre está en 0..1", () => {
    for (let t = 0; t <= 45; t += 0.5) {
      const p = pasoGuiado("manos", t).progreso;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe("pasoGuiado: araña", () => {
  it("recorre los diez dedos en 30 s", () => {
    expect(pasoGuiado("arana", 0).titulo).toContain("pulgar izquierdo");
    expect(pasoGuiado("arana", 29.9).titulo).toContain("pulgar derecho");
    expect(pasoGuiado("arana", 100).titulo).toContain("pulgar derecho");
  });
});

describe("textoEjercicio", () => {
  it("la escala son cuatro pasadas del alfabeto con ñ", () => {
    const p = textoEjercicio("escala", 1, { puntuacion: false });
    expect(p).toHaveLength(4);
    expect(p[0]).toBe("abcdefghijklmnñopqrstuvwxyz");
    expect(p[1]).toBe("zyxwvutsrqpoñnmlkjihgfedcba");
  });

  it("la fila base solo usa asdfjklñ, sin repetir letra seguida, y es determinista", () => {
    const a = textoEjercicio("fila-base", 5, { puntuacion: false });
    expect(a).toEqual(textoEjercicio("fila-base", 5, { puntuacion: false }));
    for (const w of a) {
      expect(w).toMatch(/^[asdfjklñ]{3,5}$/);
      expect(w).not.toMatch(/(.)\1/);
    }
  });

  it("el texto lento sale del banco y se puede teclear", () => {
    const p = textoEjercicio("lento", 3, { puntuacion: true });
    expect(p).toHaveLength(150);
    for (const w of p) for (const ch of w) expect(CHARMAP[ch]).toBeDefined();
  });

  it("un ejercicio guiado no tiene texto y lanza un error claro", () => {
    expect(() => textoEjercicio("manos", 1, { puntuacion: true })).toThrow();
  });

  it("la escalera sube de 2 a 10 letras con cada palabra repetida 5 veces", () => {
    const p = textoEjercicio("escalera", 3, { puntuacion: false });
    expect(p).toHaveLength(45);
    for (let largo = 2; largo <= 10; largo++) {
      const grupo = p.slice((largo - 2) * 5, (largo - 1) * 5);
      expect(new Set(grupo).size).toBe(1);
      expect(grupo[0]).toHaveLength(largo);
    }
  });

  it("alternancia solo usa palabras que cambian de mano", () => {
    const p = textoEjercicio("alternancia", 4, { puntuacion: true });
    expect(p).toHaveLength(150);
    for (const w of p) expect(fraccionAlternancia(w)).toBeGreaterThanOrEqual(0.7);
  });

  it("pares sin datos cae a alternancia y con datos refuerza esos pares", () => {
    const sin = textoEjercicio("pares", 5, { puntuacion: false });
    expect(sin.every((w) => fraccionAlternancia(w) >= 0.7)).toBe(true);
    const analisis = analizar([intentoDePrueba("a", "2026-10-01T10:00:00Z", { teclas: { a: { n: 200, e: 0, ms: 30000, msN: 200 } }, pares: { "er": { n: 20, ms: 20 * 400 } } })], { semillas: false });
    expect(analisis.pares.map((p) => p.par)).toEqual(["er"]);
    const con = textoEjercicio("pares", 5, { puntuacion: false, analisis });
    expect(con.filter((w) => w.includes("er")).length).toBeGreaterThan(sin.filter((w) => w.includes("er")).length);
  });
});

describe("cursor fantasma", () => {
  it("wpm fantasma = wpm medio por el porcentaje, o 46 si no hay datos", () => {
    expect(wpmFantasma("lento", 50)).toBeCloseTo(40);
    expect(wpmFantasma("fila-base", null)).toBeCloseTo(46 * 0.6);
    expect(wpmFantasma("escala", 50)).toBeNull();
  });

  it("los ajustes del plan cambian el porcentaje del texto lento y de la fila base", () => {
    const ajuste = { porcentajeLento: 0.72, porcentajeFilaBase: 0.54 };
    expect(wpmFantasma("lento", 50, ajuste)).toBeCloseTo(36);
    expect(wpmFantasma("fila-base", 50, ajuste)).toBeCloseTo(27);
    expect(wpmFantasma("escala", 50, ajuste)).toBeNull();
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

  it("todos los ejercicios tienen id coherente con su clave", () => {
    for (const [k, e] of Object.entries(EJERCICIOS)) expect(e.id).toBe(k);
  });
});
