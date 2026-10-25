import { describe, it, expect } from "vitest";
import { palabrasDelBanco, simplificarPalabra, PALABRAS_MINIMAS } from "../textos";
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
