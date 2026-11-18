import { describe, expect, it } from "vitest";
import { listaConY, resumenInicio } from "../resumenInicio";
import { intentoDePrueba } from "./ayudas";

const HOY = "2026-11-18";

describe("resumenInicio", () => {
  it("sin intentos todo está vacío", () => {
    expect(resumenInicio([], HOY)).toEqual({ testsTotales: 0, mejorWpm: null, media30: null, diasPracticados30: 0 });
  });

  it("cuenta solo tests y calcula la media de 30 días con su precisión", () => {
    const r = resumenInicio(
      [
        intentoDePrueba("a", "2026-11-18T10:00:00.000Z", { wpm: 40, acc: 96 }),
        intentoDePrueba("b", "2026-11-10T10:00:00.000Z", { wpm: 60, acc: 98 }),
        intentoDePrueba("c", "2026-11-10T11:00:00.000Z", { modo: "entreno", wpm: 99, acc: 99 }),
      ],
      HOY
    );
    expect(r.testsTotales).toBe(2);
    expect(r.media30).toEqual({ wpm: 50, acc: 97, n: 2 });
    expect(r.diasPracticados30).toBe(2);
  });

  it("el mejor ppm ignora tests con precisión baja y es histórico", () => {
    const r = resumenInicio(
      [
        intentoDePrueba("a", "2026-01-05T10:00:00.000Z", { wpm: 55, acc: 97 }),
        intentoDePrueba("b", "2026-11-18T10:00:00.000Z", { wpm: 80, acc: 80 }),
      ],
      HOY
    );
    expect(r.mejorWpm).toBe(55);
    expect(r.media30?.n).toBe(1);
  });

  it("deja fuera lo anterior a 30 días y lo futuro", () => {
    const r = resumenInicio(
      [
        intentoDePrueba("a", "2026-10-19T10:00:00.000Z"),
        intentoDePrueba("b", "2026-10-20T10:00:00.000Z"),
        intentoDePrueba("c", "2026-11-19T10:00:00.000Z"),
      ],
      HOY
    );
    expect(r.media30?.n).toBe(1);
    expect(r.diasPracticados30).toBe(1);
  });
});

describe("listaConY", () => {
  it("une con comas y la última con y", () => {
    expect(listaConY([])).toBe("");
    expect(listaConY(["HTML"])).toBe("HTML");
    expect(listaConY(["HTML", "CSS"])).toBe("HTML y CSS");
    expect(listaConY(["HTML", "CSS", "Linux"])).toBe("HTML, CSS y Linux");
  });
});
