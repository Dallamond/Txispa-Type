import { describe, expect, it } from "vitest";
import { construirMes, diasDelMes, mesAnterior, mesSiguiente } from "../calendario";

describe("calendario", () => {
  it("navega entre meses cruzando año", () => {
    expect(mesAnterior({ año: 2026, mes: 1 })).toEqual({ año: 2025, mes: 12 });
    expect(mesSiguiente({ año: 2026, mes: 12 })).toEqual({ año: 2027, mes: 1 });
    expect(mesSiguiente({ año: 2026, mes: 3 })).toEqual({ año: 2026, mes: 4 });
  });
  it("cuenta los días del mes", () => {
    expect(diasDelMes(2024, 2)).toBe(29);
    expect(diasDelMes(2026, 2)).toBe(28);
    expect(diasDelMes(2026, 10)).toBe(31);
  });
  it("octubre 2026 empieza en jueves y las filas son de 7", () => {
    const m = construirMes(2026, 10, "2026-10-25", new Set());
    expect(m.every((s) => s.length === 7)).toBe(true);
    expect(m[0].map((c) => c.dia)).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(m.flat().filter((c) => c.dia).length).toBe(31);
    expect(m.flat().find((c) => c.esHoy)?.dia).toBe("2026-10-25");
  });
  it("febrero 2027 empieza en lunes y ocupa 4 filas", () => {
    const m = construirMes(2027, 2, "2026-10-25", new Set());
    expect(m).toHaveLength(4);
    expect(m[0][0].dia).toBe("2027-02-01");
    expect(m.flat().some((c) => c.esHoy)).toBe(false);
  });
  it("une los cumplidos consecutivos salvo al empezar fila", () => {
    // 2026-10-04 domingo, 05 lunes, 06 martes.
    const cumplidos = new Set(["2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-09"]);
    const celdas = construirMes(2026, 10, "2026-10-25", cumplidos).flat();
    const por = (d: string) => celdas.find((c) => c.dia === d)!;
    expect(por("2026-10-03")).toMatchObject({ cumplido: true, uneConAnterior: false });
    expect(por("2026-10-04").uneConAnterior).toBe(true);
    expect(por("2026-10-05")).toMatchObject({ cumplido: true, uneConAnterior: false });
    expect(por("2026-10-06").uneConAnterior).toBe(true);
    expect(por("2026-10-09")).toMatchObject({ cumplido: true, uneConAnterior: false });
    expect(por("2026-10-07").cumplido).toBe(false);
  });
});
