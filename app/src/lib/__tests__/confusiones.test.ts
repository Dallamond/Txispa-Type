import { describe, expect, it } from "vitest";
import type { Intento } from "../../types";
import { confusionesAgregadas } from "../confusiones";

function intento(n: number, confusiones: Record<string, number>): Intento {
  return { date: `2026-10-${String(n).padStart(2, "0")}T10:00:00Z`, confusiones } as unknown as Intento;
}

describe("confusionesAgregadas", () => {
  it("suma, ordena y calcula porcentajes", () => {
    const r = confusionesAgregadas([intento(1, { "v>b": 2, "x>z": 1 }), intento(2, { "v>b": 1, "a>s": 0 })]);
    expect(r).toEqual([
      { esperada: "v", escrita: "b", veces: 3, porcentaje: 75 },
      { esperada: "x", escrita: "z", veces: 1, porcentaje: 25 },
    ]);
  });
  it("solo usa los últimos intentos de la ventana", () => {
    const r = confusionesAgregadas([intento(1, { "a>s": 5 }), intento(2, { "b>n": 1 }), intento(3, { "c>d": 1 })], 2);
    expect(r.map((c) => c.esperada)).toEqual(["b", "c"]);
  });
  it("recorta al top N y devuelve vacío sin datos", () => {
    const conf: Record<string, number> = {};
    for (let i = 0; i < 12; i++) conf[`${String.fromCharCode(97 + i)}>z`] = 12 - i;
    expect(confusionesAgregadas([intento(1, conf)])).toHaveLength(10);
    expect(confusionesAgregadas([])).toEqual([]);
  });
  it("conserva el espacio como carácter", () => {
    expect(confusionesAgregadas([intento(1, { "␣>n": 2 })])[0]).toMatchObject({ esperada: "␣", escrita: "n" });
  });
});
