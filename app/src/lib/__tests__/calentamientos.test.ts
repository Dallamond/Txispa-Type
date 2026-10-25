import { describe, it, expect } from "vitest";
import {
  EJERCICIOS,
  duracionRutina,
  ejerciciosDeRutina,
  pasoGuiado,
  posicionFantasma,
  textoEjercicio,
  ubicarEnPalabras,
  wpmFantasma,
} from "../calentamientos";
import { CHARMAP } from "../../data/keyboard";

describe("rutinas", () => {
  it("duran lo que dice la especificación", () => {
    expect(duracionRutina("rapida")).toBe(195);
    expect(duracionRutina("estandar")).toBe(345);
    expect(duracionRutina("completa")).toBe(495);
  });

  it("solo incluyen ejercicios disponibles", () => {
    for (const r of ["rapida", "estandar", "completa"] as const) {
      expect(ejerciciosDeRutina(r).every((e) => e.disponible)).toBe(true);
    }
    expect(ejerciciosDeRutina("rapida").map((e) => e.id)).toEqual(["manos", "escala", "fila-base", "lento"]);
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

  it("un ejercicio sin generador lanza un error claro", () => {
    expect(() => textoEjercicio("pares", 1, { puntuacion: true })).toThrow();
  });
});

describe("cursor fantasma", () => {
  it("wpm fantasma = wpm medio por el porcentaje, o 46 si no hay datos", () => {
    expect(wpmFantasma("lento", 50)).toBeCloseTo(40);
    expect(wpmFantasma("fila-base", null)).toBeCloseTo(46 * 0.6);
    expect(wpmFantasma("escala", 50)).toBeNull();
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
