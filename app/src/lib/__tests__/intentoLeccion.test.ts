import { describe, it, expect } from "vitest";
import { crearIntentoLeccion } from "../intento";
import { MotorCodigo } from "../motorCodigo";
import { tokenizar } from "../curso";
import { esIntentoValido, PATRON_LECCION_ID } from "../exportar";
import { etiquetaFuente } from "../historial";
import { intentoDePrueba } from "./ayudas";

function leccionTecleada(errores = 0) {
  const m = new MotorCodigo(tokenizar("<ul>\n  <li>Pan</li>\n</ul>"));
  let t = 1000;
  for (let i = 0; i < errores; i++) {
    m.tecla("x", t); // letra equivocada al principio
    m.tecla("Backspace", t + 50);
    t += 100;
  }
  for (const ch of "<ul>\n<li>Pan</li>\n</ul>") {
    m.tecla(ch === "\n" ? "Enter" : ch, t);
    t += 150;
  }
  return { m, t };
}

describe("crearIntentoLeccion", () => {
  it("es un entreno de fuente curso con su leccionId y la duración que se tardó", () => {
    const { m, t } = leccionTecleada();
    const i = crearIntentoLeccion({ motor: m, ts: t, leccionId: "html/L01.01", estricto: false, id: "a", fecha: new Date("2026-11-06T10:00:00Z") });
    expect(i.modo).toBe("entreno");
    expect(i.fuente).toBe("curso");
    expect(i.leccionId).toBe("html/L01.01");
    expect(i.correct).toBe(23);
    expect(i.errors).toBe(0);
    expect(i.acc).toBe(100);
    expect(i.durationSec).toBe(Math.ceil(i.elapsedSec));
    expect(i.durationSec).toBeLessThan(60);
    expect(i.teclas["⏎"]).toMatchObject({ n: 2, e: 0 });
    expect(esIntentoValido(i)).toBe(true);
  });

  it("la precisión baja con los errores", () => {
    const { m, t } = leccionTecleada(2);
    const i = crearIntentoLeccion({ motor: m, ts: t, leccionId: "css/L06.R", estricto: false, id: "b", fecha: new Date() });
    expect(i.errors).toBe(2);
    expect(i.acc).toBeLessThan(100);
  });
});

describe("leccionId en la importación", () => {
  it("acepta ids del curso y rechaza los que no tienen la forma", () => {
    for (const id of ["html/L01.01", "css/L06.R", "html/L12.04"]) expect(PATRON_LECCION_ID.test(id), id).toBe(true);
    for (const id of ["js/L01.01", "html/L1.01", "html/L01.", "L01.01", ""]) expect(PATRON_LECCION_ID.test(id), id).toBe(false);
    const base = intentoDePrueba("a", "2026-11-06T10:00:00Z", { modo: "entreno", fuente: "curso" });
    expect(esIntentoValido({ ...base, leccionId: "html/L01.01" })).toBe(true);
    expect(esIntentoValido({ ...base, leccionId: "html/malo" })).toBe(false);
    expect(esIntentoValido({ ...base, leccionId: 5 })).toBe(false);
    expect(esIntentoValido(base)).toBe(true);
  });

  it("la fuente curso tiene nombre legible", () => {
    expect(etiquetaFuente("curso")).toBe("Curso");
  });
});
