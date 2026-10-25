import { describe, expect, it } from "vitest";
import type { Intento } from "../../types";
import { calcularAjustes, diaSemana, focoDelDia, pasosDelDia } from "../plan";

let n = 0;
function intento(localDate: string, p: Partial<Intento> = {}): Intento {
  n++;
  return {
    id: `i${n}`, date: `${localDate}T10:00:00Z`, localDate, modo: "test", fuente: "banco", durationSec: 60,
    elapsedSec: 60, seed: 1, estricto: false, correct: 200, errors: 0, wpm: 50, rawWpm: 50, acc: 98,
    consistency: null, teclas: {}, pares: {}, confusiones: {}, ...p,
  };
}
function tests(dia: string, acc: number, cuantos = 3): Intento[] {
  return Array.from({ length: cuantos }, () => intento(dia, { acc }));
}

const HOY = "2026-10-26"; // lunes

describe("diaSemana", () => {
  it("0 = lunes … 6 = domingo", () => {
    expect(diaSemana("2026-10-26")).toBe(0);
    expect(diaSemana("2026-10-27")).toBe(1);
    expect(diaSemana("2026-10-31")).toBe(5);
    expect(diaSemana("2026-11-01")).toBe(6);
    expect(diaSemana("2026-11-02")).toBe(0);
  });
});

describe("focoDelDia", () => {
  it("lunes: banco al 80%, 12 min", () => {
    const f = focoDelDia("2026-10-26");
    expect(f.dia).toBe("lunes");
    expect(f.foco).toBe("Precisión");
    expect(f.entreno).toMatchObject({ fuente: "banco", minutos: 12, porcentajeVelocidad: 0.8 });
  });
  it("martes: pares débiles", () => {
    const f = focoDelDia("2026-10-27");
    expect(f.dia).toBe("martes");
    expect(f.foco).toBe("Pares débiles");
    expect(f.entreno).toMatchObject({ fuente: "debiles", minutos: 12 });
  });
  it("miércoles: alternancia", () => {
    const f = focoDelDia("2026-10-28");
    expect(f.dia).toBe("miércoles");
    expect(f.entreno.fuente).toBe("alternancia");
  });
  it("jueves: volumen con ia y respaldo banco", () => {
    const f = focoDelDia("2026-10-29");
    expect(f.dia).toBe("jueves");
    expect(f.foco).toBe("Volumen");
    expect(f.entreno).toMatchObject({ fuente: "ia", respaldo: "banco", minutos: 12 });
  });
  it("viernes: metrónomo", () => {
    const f = focoDelDia("2026-10-30");
    expect(f.dia).toBe("viernes");
    expect(f.foco).toBe("Ritmo constante");
    expect(f.entreno.fuente).toBe("metronomo");
  });
  it("sábado: ligero, 6 min de teclas débiles", () => {
    const f = focoDelDia("2026-10-31");
    expect(f.dia).toBe("sábado");
    expect(f.foco).toBe("Ligero");
    expect(f.entreno).toMatchObject({ fuente: "debiles", minutos: 6 });
  });
  it("domingo: medición con tests 60 y 120", () => {
    const f = focoDelDia("2026-11-01");
    expect(f.dia).toBe("domingo");
    expect(f.foco).toBe("Medición");
    expect(f.entreno.minutos).toBe(0);
    expect(f.entreno.tests).toEqual([60, 120]);
  });
  it("no comparte referencias mutables", () => {
    focoDelDia("2026-11-01").entreno.tests!.push(1);
    expect(focoDelDia("2026-11-01").entreno.tests).toEqual([60, 120]);
  });
});

describe("calcularAjustes", () => {
  it("semana sin datos: base", () => {
    expect(calcularAjustes([], HOY, true)).toEqual({ porcentajeLento: 0.8, porcentajeFilaBase: 0.6, ajustes: [] });
  });
  it("regla A: precisión de la semana anterior < 95 baja un 10% relativo", () => {
    // semana anterior = 2026-10-13 .. 2026-10-19
    const r = calcularAjustes(tests("2026-10-15", 94.2), HOY, true);
    expect(r.porcentajeLento).toBe(0.72);
    expect(r.porcentajeFilaBase).toBe(0.54);
    expect(r.ajustes).toHaveLength(1);
    expect(r.ajustes[0].id).toBe("mas-despacio");
    expect(r.ajustes[0].motivo).toBe("Esta semana, 10% más despacio: tu precisión fue 94,2%");
  });
  it("regla A: los límites de la ventana son [hoy-13, hoy-7]", () => {
    expect(calcularAjustes(tests("2026-10-13", 90), HOY, true).porcentajeLento).toBe(0.72);
    expect(calcularAjustes(tests("2026-10-19", 90), HOY, true).porcentajeLento).toBe(0.72);
    expect(calcularAjustes(tests("2026-10-12", 90), HOY, true).porcentajeLento).toBe(0.8);
    expect(calcularAjustes(tests("2026-10-20", 90), HOY, true).porcentajeLento).toBe(0.8);
  });
  it("regla A: exactamente 95 no baja", () => {
    expect(calcularAjustes(tests("2026-10-15", 95), HOY, true).ajustes).toEqual([]);
  });
  it("pocos tests (<3) en la semana anterior: la A no aplica", () => {
    expect(calcularAjustes(tests("2026-10-15", 80, 2), HOY, true).ajustes).toEqual([]);
  });
  it("ignora intentos de entreno", () => {
    const e = Array.from({ length: 5 }, () => intento("2026-10-15", { modo: "entreno", acc: 70 }));
    expect(calcularAjustes(e, HOY, true).ajustes).toEqual([]);
  });
  it("regla B: tres días seguidos >= 97 sube el texto lento a 0.84", () => {
    const d = [...tests("2026-10-22", 97), ...tests("2026-10-23", 98), ...tests("2026-10-24", 99)];
    const r = calcularAjustes(d, HOY, true);
    expect(r.porcentajeLento).toBe(0.84);
    expect(r.porcentajeFilaBase).toBe(0.6);
    expect(r.ajustes[0].id).toBe("mas-rapido");
    expect(r.ajustes[0].motivo).toContain("97%");
  });
  it("regla B: termina en el último día con tests, aunque no sea hoy", () => {
    const d = [...tests("2026-10-14", 97), ...tests("2026-10-15", 98), ...tests("2026-10-16", 99)];
    // esos días caen en la semana anterior con media 98: la A no aplica
    expect(calcularAjustes(d, HOY, true).porcentajeLento).toBe(0.84);
  });
  it("regla B: un día intermedio sin tests o por debajo de 97 la rompe", () => {
    const sinHueco = [...tests("2026-10-22", 98), ...tests("2026-10-24", 98), ...tests("2026-10-25", 98)];
    expect(calcularAjustes(sinHueco, HOY, true).ajustes).toEqual([]);
    const bajo = [...tests("2026-10-23", 98), ...tests("2026-10-24", 96.9), ...tests("2026-10-25", 98)];
    expect(calcularAjustes(bajo, HOY, true).ajustes).toEqual([]);
  });
  it("la precisión diaria es la media de los tests del día", () => {
    const d = [
      intento("2026-10-23", { acc: 99 }), intento("2026-10-23", { acc: 95 }), // media 97
      ...tests("2026-10-24", 97), ...tests("2026-10-25", 97),
    ];
    expect(calcularAjustes(d, HOY, true).porcentajeLento).toBe(0.84);
  });
  it("ambas reglas: gana la A", () => {
    const d = [
      ...tests("2026-10-14", 90), // semana anterior mala
      ...tests("2026-10-23", 98), ...tests("2026-10-24", 98), ...tests("2026-10-25", 98),
    ];
    const r = calcularAjustes(d, HOY, true);
    expect(r.porcentajeLento).toBe(0.72);
    expect(r.ajustes.map((a) => a.id)).toEqual(["mas-despacio"]);
  });
  it("reglas desactivadas: base sin ajustes", () => {
    expect(calcularAjustes(tests("2026-10-15", 80), HOY, false)).toEqual({
      porcentajeLento: 0.8, porcentajeFilaBase: 0.6, ajustes: [],
    });
  });
});

describe("pasosDelDia", () => {
  it("sin datos: nada hecho", () => {
    const p = pasosDelDia(HOY, HOY, [], 3);
    expect(p.map((x) => x.id)).toEqual(["calentamiento", "entreno", "tests", "revision"]);
    expect(p.every((x) => !x.hecho)).toBe(true);
    expect(p.find((x) => x.id === "calentamiento")?.manual).toBe(true);
    expect(p.find((x) => x.id === "revision")?.manual).toBe(true);
  });
  it("tests hechos al alcanzar el objetivo", () => {
    expect(pasosDelDia(HOY, HOY, tests(HOY, 98, 2), 3)[2].hecho).toBe(false);
    expect(pasosDelDia(HOY, HOY, tests(HOY, 98, 3), 3)[2].hecho).toBe(true);
    expect(pasosDelDia(HOY, HOY, tests("2026-10-25", 98, 3), 3)[2].hecho).toBe(false);
  });
  it("entreno hecho solo con entreno de hoy que no sea ejercicio", () => {
    const ej = intento(HOY, { modo: "entreno", fuente: "ejercicio" });
    expect(pasosDelDia(HOY, HOY, [ej], 3)[1].hecho).toBe(false);
    const ent = intento(HOY, { modo: "entreno", fuente: "debiles" });
    expect(pasosDelDia(HOY, HOY, [ent], 3)[1].hecho).toBe(true);
    const ayer = intento("2026-10-25", { modo: "entreno", fuente: "debiles" });
    expect(pasosDelDia(HOY, HOY, [ayer], 3)[1].hecho).toBe(false);
  });
  it("domingo: el detalle habla de medición y de los tests de 60 y 120 s", () => {
    const p = pasosDelDia("2026-11-01", "2026-11-01", [], 3);
    expect(p[1].detalle).toContain("Medición");
    expect(p[2].detalle).toContain("60 s y 120 s");
  });
});
