import { describe, it, expect } from "vitest";
import {
  agruparEnFrases,
  fraccionAlternancia,
  manoDe,
  palabrasAlternancia,
  palabrasDebiles,
  palabrasDelBanco,
  palabrasQueAlternan,
  refuerzoPalabra,
  simplificarPalabra,
  PALABRAS_MINIMAS,
} from "../textos";
import { analizar } from "../debiles";
import { mulberry32 } from "../rng";
import { CHARMAP } from "../../data/keyboard";

describe("simplificarPalabra", () => {
  it("quita puntuación y pasa a minúsculas", () => {
    expect(simplificarPalabra("¿Cómo,")).toBe("cómo");
    expect(simplificarPalabra("(hola)")).toBe("hola");
    expect(simplificarPalabra("Ñandú.")).toBe("ñandú");
  });

  it("un guion suelto desaparece, uno interno se conserva", () => {
    expect(simplificarPalabra("-")).toBe("");
    expect(simplificarPalabra("coche-cama")).toBe("coche-cama");
  });
});

describe("palabrasDelBanco", () => {
  it("devuelve exactamente el mínimo pedido", () => {
    expect(palabrasDelBanco(1, { puntuacion: true })).toHaveLength(PALABRAS_MINIMAS);
    expect(palabrasDelBanco(1, { puntuacion: true, minPalabras: 50 })).toHaveLength(50);
  });

  it("es determinista por semilla", () => {
    expect(palabrasDelBanco(42, { puntuacion: true })).toEqual(palabrasDelBanco(42, { puntuacion: true }));
  });

  it("semillas distintas dan textos distintos", () => {
    expect(palabrasDelBanco(1, { puntuacion: true, minPalabras: 100 })).not.toEqual(
      palabrasDelBanco(2, { puntuacion: true, minPalabras: 100 })
    );
  });

  it("sin puntuación no hay mayúsculas ni signos, y no hay palabras vacías", () => {
    const palabras = palabrasDelBanco(7, { puntuacion: false });
    for (const p of palabras) {
      expect(p.length).toBeGreaterThan(0);
      expect(p).toBe(p.toLowerCase());
      expect(p).not.toMatch(/[.,;:¿?¡!()"']/);
    }
  });

  it("con puntuación aparecen signos y mayúsculas", () => {
    const texto = palabrasDelBanco(7, { puntuacion: true }).join(" ");
    expect(texto).toMatch(/[.,]/);
    expect(texto).toMatch(/[A-ZÁÉÍÓÚÑ]/);
  });

  it("todo se puede teclear en el teclado ISO español", () => {
    for (const p of palabrasDelBanco(3, { puntuacion: true })) {
      for (const ch of p) expect(CHARMAP[ch]).toBeDefined();
    }
  });
});

describe("fuente debiles", () => {
  const conSemillas = analizar([]); // v, x, u, y
  const sinNada = analizar([], { semillas: false });

  it("sin nada que reforzar cae al banco", () => {
    expect(palabrasDebiles(9, sinNada, { puntuacion: true, minPalabras: 100 })).toEqual(
      palabrasDelBanco(9, { puntuacion: true, minPalabras: 100 })
    );
  });

  it("es determinista y del tamaño pedido", () => {
    const a = palabrasDebiles(4, conSemillas, { puntuacion: false, minPalabras: 200 });
    expect(a).toHaveLength(200);
    expect(a).toEqual(palabrasDebiles(4, conSemillas, { puntuacion: false, minPalabras: 200 }));
  });

  it("lleva muchas más palabras con las letras débiles que el texto normal", () => {
    const cuenta = (ws: string[]) => ws.filter((w) => /[vxuy]/.test(w)).length / ws.length;
    const reforzado = palabrasDebiles(1, conSemillas, { puntuacion: false, minPalabras: 600 });
    const normal = palabrasDelBanco(1, { puntuacion: false, minPalabras: 600 });
    expect(cuenta(reforzado)).toBeGreaterThan(cuenta(normal) + 0.1);
  });

  it("nunca repite la misma palabra seguida", () => {
    const ws = palabrasDebiles(2, conSemillas, { puntuacion: false, minPalabras: 400 });
    for (let i = 1; i < ws.length; i++) expect(ws[i]).not.toBe(ws[i - 1]);
  });

  it("refuerzoPalabra: una palabra con letras débiles pesa más que una sin ellas", () => {
    expect(refuerzoPalabra("vuelve", conSemillas)).toBeGreaterThan(refuerzoPalabra("casa", conSemillas));
    expect(refuerzoPalabra("casa", sinNada)).toBe(0);
  });

  it("con puntuación agrupa en frases con mayúscula y punto", () => {
    const ws = palabrasDebiles(3, conSemillas, { puntuacion: true, minPalabras: 100 });
    expect(ws[0][0]).toBe(ws[0][0].toUpperCase());
    expect(ws[ws.length - 1].endsWith(".")).toBe(true);
  });
});

describe("agruparEnFrases", () => {
  it("cada frase empieza en mayúscula y acaba en punto, sin perder palabras", () => {
    const ws = Array.from({ length: 40 }, (_, i) => `pal${i}`);
    const out = agruparEnFrases(ws, mulberry32(1));
    expect(out).toHaveLength(40);
    expect(out[0]).toBe("Pal0");
    expect(out.filter((w) => w.endsWith(".")).length).toBeGreaterThanOrEqual(3);
    expect(out[out.length - 1].endsWith(".")).toBe(true);
  });
});

describe("alternancia de manos", () => {
  it("manoDe: izquierda 0-3, derecha 4-7, el espacio no tiene mano", () => {
    expect(manoDe("a")).toBe("izq");
    expect(manoDe("v")).toBe("izq");
    expect(manoDe("j")).toBe("der");
    expect(manoDe("ñ")).toBe("der");
    expect(manoDe(" ")).toBeNull();
  });

  it("fraccionAlternancia mide los cambios de mano", () => {
    expect(fraccionAlternancia("ajaj")).toBe(1);
    expect(fraccionAlternancia("asdf")).toBe(0);
    expect(fraccionAlternancia("a")).toBe(0);
  });

  it("el banco de alternancia cumple el 70% y es suficientemente grande", () => {
    const pool = palabrasQueAlternan();
    expect(pool.length).toBeGreaterThan(60);
    for (const w of pool) expect(fraccionAlternancia(w)).toBeGreaterThanOrEqual(0.7);
  });

  it("palabrasAlternancia es determinista y solo usa ese banco", () => {
    const a = palabrasAlternancia(5, { puntuacion: false, minPalabras: 100 });
    expect(a).toEqual(palabrasAlternancia(5, { puntuacion: false, minPalabras: 100 }));
    const pool = new Set(palabrasQueAlternan());
    for (const w of a) expect(pool.has(w)).toBe(true);
  });
});
