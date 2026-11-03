import { describe, expect, it } from "vitest";
import { mapaActividad, nivelDeActividad } from "../actividad";
import { intentoDePrueba } from "./ayudas";

describe("nivelDeActividad", () => {
  it("sin práctica es 0 y la meta cumplida es 4", () => {
    expect(nivelDeActividad(0, 0, 20)).toBe(0);
    expect(nivelDeActividad(1200, 5000, 20)).toBe(4);
    expect(nivelDeActividad(3000, 5000, 20)).toBe(4);
  });
  it("reparte por tercios de la meta", () => {
    expect(nivelDeActividad(60, 300, 20)).toBe(1);
    expect(nivelDeActividad(399, 2000, 20)).toBe(1);
    expect(nivelDeActividad(600, 3000, 20)).toBe(2);
    expect(nivelDeActividad(900, 4000, 20)).toBe(3);
  });
  it("con meta 0 cualquier práctica cuenta como cumplida", () => {
    expect(nivelDeActividad(30, 100, 0)).toBe(4);
  });
});

describe("mapaActividad", () => {
  // 2026-11-03 es martes.
  const hoy = "2026-11-03";

  it("53 columnas de 7 días, de lunes a domingo, y la última es la semana de hoy", () => {
    const m = mapaActividad([], hoy, 20);
    expect(m.columnas).toHaveLength(53);
    expect(m.columnas.every((c) => c.length === 7)).toBe(true);
    const ultima = m.columnas[52];
    expect(ultima[0].dia).toBe("2026-11-02");
    expect(ultima[1].dia).toBe(hoy);
    expect(ultima[1].futuro).toBe(false);
    expect(ultima.slice(2).every((c) => c.futuro)).toBe(true);
    expect(m.columnas[0][0].dia).toBe("2025-11-03");
    expect(m.diasConPractica).toBe(0);
  });

  it("suma pulsaciones, segundos, tests y entrenos por día", () => {
    const intentos = [
      intentoDePrueba("a", "2026-11-03T09:00:00Z", { correct: 250, errors: 10, elapsedSec: 60 }),
      intentoDePrueba("b", "2026-11-03T10:00:00Z", { modo: "entreno", correct: 1000, errors: 40, elapsedSec: 300 }),
      intentoDePrueba("c", "2026-10-20T10:00:00Z", { correct: 100, errors: 0, elapsedSec: 1200 }),
    ];
    const m = mapaActividad(intentos, hoy, 20);
    const celdaHoy = m.columnas[52][1];
    expect(celdaHoy).toMatchObject({ pulsaciones: 1300, segundos: 360, tests: 1, entrenos: 1, nivel: 1 });
    const celda20 = m.columnas.flat().find((c) => c.dia === "2026-10-20");
    expect(celda20?.nivel).toBe(4);
    expect(m.diasConPractica).toBe(2);
    expect(m.pulsaciones).toBe(1400);
    expect(m.segundos).toBe(1560);
  });

  it("ignora intentos fuera de la ventana y en el futuro", () => {
    const intentos = [
      intentoDePrueba("viejo", "2024-01-01T10:00:00Z"),
      intentoDePrueba("futuro", "2026-11-05T10:00:00Z"),
    ];
    const m = mapaActividad(intentos, hoy, 20);
    expect(m.diasConPractica).toBe(0);
    expect(m.columnas[52][3].pulsaciones).toBe(0);
  });

  it("pone el nombre del mes en la semana de su día 1", () => {
    const m = mapaActividad([], hoy, 20);
    const nov = m.meses.find((e) => e.nombre === "nov" && e.columna > 0);
    // 2026-11-01 es domingo: cae en la semana que empieza el lunes 26 de octubre.
    expect(m.columnas[nov!.columna].some((c) => c.dia === "2026-11-01")).toBe(true);
    expect(m.meses[0]).toEqual({ columna: 0, nombre: "nov" });
    expect(m.meses.filter((e) => e.nombre === "ene")).toHaveLength(1);
  });
});
