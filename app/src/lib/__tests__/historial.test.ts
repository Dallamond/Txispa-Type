import { describe, expect, it } from "vitest";
import {
  etiquetaDuracion,
  filtrarPorDuracion,
  filtrarPorModo,
  formatoDia,
  formatoHora,
  formatoNumero,
  formatoTiempo,
  formatoVariacion,
  mediaMovil,
  ordenarHistorial,
  precisionBaja,
  serieParaGrafica,
  ticksRedondos,
} from "../historial";
import type { Intento } from "../../types";
import { intentoDePrueba } from "./ayudas";

let c = 0;
function i(hora: number, extra: Partial<Intento> = {}): Intento {
  c++;
  return intentoDePrueba(`h${c}`, `2026-10-25T${String(hora).padStart(2, "0")}:00:00.000Z`, extra);
}

describe("historial", () => {
  const a = i(8, { wpm: 50, acc: 97, durationSec: 60 });
  const b = i(9, { wpm: 60, acc: 93, durationSec: 120 });
  const d = i(10, { wpm: 55, acc: 99, durationSec: 60, modo: "entreno" });

  it("filtra por duración y modo", () => {
    expect(filtrarPorDuracion([a, b, d], 60)).toEqual([a, d]);
    expect(filtrarPorDuracion([a, b, d], "todas")).toHaveLength(3);
    expect(filtrarPorModo([a, b, d], "entreno")).toEqual([d]);
    expect(filtrarPorModo([a, b, d], "todos")).toHaveLength(3);
  });

  it("ordena sin mutar", () => {
    const orig = [a, b, d];
    expect(ordenarHistorial(orig, "velocidad", "desc").map((x) => x.wpm)).toEqual([60, 55, 50]);
    expect(ordenarHistorial(orig, "precision", "asc").map((x) => x.acc)).toEqual([93, 97, 99]);
    expect(ordenarHistorial(orig, "fecha", "desc")[0]).toBe(d);
    expect(orig).toEqual([a, b, d]);
  });

  it("serie de gráfica: solo tests, recortada y ascendente", () => {
    const s = serieParaGrafica([b, d, a], "todas", 2);
    expect(s).toEqual([a, b]);
    expect(serieParaGrafica([a, b], 120)).toEqual([b]);
  });

  it("media móvil", () => {
    expect(mediaMovil([10, 20, 30], 2)).toEqual([10, 15, 25]);
    expect(mediaMovil([])).toEqual([]);
  });

  it("formatos", () => {
    expect(precisionBaja(94.9)).toBe(true);
    expect(precisionBaja(95)).toBe(false);
    expect(formatoNumero(46.25)).toBe("46,3");
    expect(formatoDia("2026-10-05")).toBe("05/10/2026");
    expect(formatoVariacion(4.24)).toBe("+4,2 %");
    expect(formatoVariacion(-3)).toBe("−3,0 %");
    expect(formatoHora("2026-10-25T10:05:00.000Z")).toBe("11:05");
    expect(formatoHora("2026-07-01T10:05:00.000Z")).toBe("12:05");
    expect(etiquetaDuracion(30)).toBe("30 s");
    expect(etiquetaDuracion(120)).toBe("2 min");
  });
});

describe("ticksRedondos", () => {
  it("usa pasos redondos dentro del dominio", () => {
    expect(ticksRedondos(30, 70)).toEqual([30, 40, 50, 60, 70]);
    expect(ticksRedondos(85, 100)).toEqual([85, 90, 95, 100]);
    expect(ticksRedondos(0, 12)).toEqual([0, 5, 10]);
  });

  it("entre 2 y 7 marcas y siempre dentro del rango", () => {
    for (const [lo, hi] of [[0, 1], [3, 97], [90, 100], [12, 13.5], [0, 250]] as const) {
      const t = ticksRedondos(lo, hi);
      expect(t.length).toBeGreaterThanOrEqual(2);
      expect(t.length).toBeLessThanOrEqual(7);
      for (const v of t) {
        expect(v).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(v).toBeLessThanOrEqual(hi + 1e-9);
      }
    }
  });

  it("un rango vacío devuelve solo el valor", () => {
    expect(ticksRedondos(5, 5)).toEqual([5]);
  });
});

describe("formatoTiempo", () => {
  it("formatea segundos, minutos y horas", () => {
    expect(formatoTiempo(45)).toBe("45 s");
    expect(formatoTiempo(60)).toBe("1 min");
    expect(formatoTiempo(750)).toBe("12 min 30 s");
    expect(formatoTiempo(3900)).toBe("1 h 05 min");
    expect(formatoTiempo(-3)).toBe("0 s");
  });
});
