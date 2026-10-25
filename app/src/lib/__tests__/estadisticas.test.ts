import { describe, expect, it } from "vitest";
import {
  diaLocal,
  diasCumplidos,
  medianaDelDia,
  mediaSemanal,
  mediasSemanales,
  mediaUltimos,
  objetivoDelDia,
  peorDelDia,
  pulsacionesTotales,
  racha,
  resumenPorDia,
  segundosDelDia,
  soloTests,
  sumarDias,
  tendencia,
  testsDelDia,
  tiempoDelDia,
  variacionSemanal,
} from "../estadisticas";
import type { Intento } from "../../types";
import { intentoDePrueba } from "./ayudas";

const HOY = "2026-10-25";
let contador = 0;

/** Test en un día concreto. */
function t(dia: string, wpm: number, extra: Partial<Intento> = {}): Intento {
  contador++;
  return intentoDePrueba(`i${contador}`, `${dia}T10:00:00.000Z`, { wpm, ...extra });
}

describe("fechas", () => {
  it("sumarDias cruza mes y año", () => {
    expect(sumarDias("2026-10-31", 1)).toBe("2026-11-01");
    expect(sumarDias("2026-01-01", -1)).toBe("2025-12-31");
    expect(sumarDias("2024-02-28", 1)).toBe("2024-02-29");
    expect(sumarDias("2026-10-25", 0)).toBe("2026-10-25");
  });
  it("diaLocal usa Europe/Madrid", () => {
    expect(diaLocal(new Date("2026-10-24T22:30:00Z"))).toBe("2026-10-25");
    expect(diaLocal(new Date("2026-07-01T12:00:00Z"))).toBe("2026-07-01");
  });
});

describe("filtros y medias", () => {
  it("con lista vacía todo es null o vacío", () => {
    expect(soloTests([])).toEqual([]);
    expect(mediaSemanal([], HOY)).toBeNull();
    expect(medianaDelDia([], HOY)).toBeNull();
    expect(peorDelDia([], HOY)).toBeNull();
    expect(mediaUltimos([], 10)).toBeNull();
    expect(resumenPorDia([], 14, HOY)).toEqual([]);
    expect(racha([], HOY, 3)).toBe(0);
  });

  it("ignora los entrenos", () => {
    const lista = [t(HOY, 50), t(HOY, 99, { modo: "entreno" })];
    expect(soloTests(lista)).toHaveLength(1);
    expect(testsDelDia(lista, HOY)).toHaveLength(1);
    expect(mediaSemanal(lista, HOY)?.wpm).toBe(50);
    expect(peorDelDia(lista, HOY)).toBe(50);
  });

  it("un solo test", () => {
    const m = mediaSemanal([t(HOY, 48, { acc: 97 })], HOY);
    expect(m).toEqual({ wpm: 48, acc: 97, n: 1 });
  });

  it("la media semanal cubre 7 días incluido hoy", () => {
    const lista = [t(sumarDias(HOY, -6), 40), t(sumarDias(HOY, -7), 100), t(HOY, 60)];
    const m = mediaSemanal(lista, HOY);
    expect(m?.n).toBe(2);
    expect(m?.wpm).toBe(50);
  });

  it("mediana impar, par y peor del día", () => {
    const impar = [t(HOY, 50), t(HOY, 40), t(HOY, 70)];
    expect(medianaDelDia(impar, HOY)).toBe(50);
    expect(peorDelDia(impar, HOY)).toBe(40);
    expect(medianaDelDia([...impar, t(HOY, 60)], HOY)).toBe(55);
  });

  it("día sin tests da null", () => {
    const lista = [t(HOY, 50)];
    const ayer = sumarDias(HOY, -1);
    expect(medianaDelDia(lista, ayer)).toBeNull();
    expect(peorDelDia(lista, ayer)).toBeNull();
    expect(testsDelDia(lista, ayer)).toEqual([]);
  });

  it("mediaUltimos toma los n últimos y puede excluir uno", () => {
    const lista = Array.from({ length: 12 }, (_, i) => t(sumarDias(HOY, -(11 - i)), 40 + i));
    // wpm 40..51; los últimos 10 son 42..51, media 46,5
    expect(mediaUltimos(lista, 10)?.wpm).toBeCloseTo(46.5);
    expect(mediaUltimos(lista, 10)?.n).toBe(10);
    // sin el último (51): 41..50, media 45,5
    expect(mediaUltimos(lista, 10, lista[11].id)?.wpm).toBeCloseTo(45.5);
    expect(mediaUltimos(lista.slice(0, 3), 10)?.n).toBe(3);
  });
});

describe("medias semanales y tendencia", () => {
  it("devuelve 8 ventanas de la más antigua a la más reciente", () => {
    const m = mediasSemanales([], HOY);
    expect(m).toHaveLength(8);
    expect(m[7].semanaTermina).toBe(HOY);
    expect(m[0].semanaTermina).toBe(sumarDias(HOY, -49));
    expect(m.every((x) => x.wpm === null && x.n === 0)).toBe(true);
  });

  it("pendiente positiva conocida (+2 wpm por semana)", () => {
    const lista: Intento[] = [];
    for (let s = 0; s < 8; s++) lista.push(t(sumarDias(HOY, -7 * (7 - s)), 40 + 2 * s));
    const m = mediasSemanales(lista, HOY);
    expect(m.map((x) => x.wpm)).toEqual([40, 42, 44, 46, 48, 50, 52, 54]);
    expect(tendencia(m)).toBeCloseTo(2);
    expect(variacionSemanal(m)).toBeCloseTo(((54 - 52) / 52) * 100);
  });

  it("pendiente negativa conocida (-1,5 wpm por semana)", () => {
    const lista: Intento[] = [];
    for (let s = 0; s < 8; s++) lista.push(t(sumarDias(HOY, -7 * (7 - s)), 60 - 1.5 * s));
    const m = mediasSemanales(lista, HOY);
    expect(tendencia(m)).toBeCloseTo(-1.5);
    expect(variacionSemanal(m)).toBeLessThan(0);
  });

  it("ignora semanas null en la tendencia", () => {
    const lista = [t(sumarDias(HOY, -21), 40), t(sumarDias(HOY, -7), 46), t(HOY, 48)];
    const m = mediasSemanales(lista, HOY);
    expect(m.filter((x) => x.wpm !== null)).toHaveLength(3);
    expect(tendencia(m)).not.toBeNull();
  });

  it("null con menos de 2 puntos o sin las dos últimas semanas", () => {
    expect(tendencia(mediasSemanales([], HOY))).toBeNull();
    const una = mediasSemanales([t(HOY, 50)], HOY);
    expect(tendencia(una)).toBeNull();
    expect(variacionSemanal(una)).toBeNull();
  });
});

describe("objetivo y racha", () => {
  const dosTests = (dia: string) => [t(dia, 50), t(dia, 52)];

  it("objetivoDelDia: parcial, cumplido y con tope", () => {
    expect(objetivoDelDia([t(HOY, 50)], HOY, 3)).toEqual({
      hechos: 1,
      objetivo: 3,
      cumplido: false,
      fraccion: 1 / 3,
    });
    const cinco = Array.from({ length: 5 }, () => t(HOY, 50));
    const o = objetivoDelDia(cinco, HOY, 3);
    expect(o.cumplido).toBe(true);
    expect(o.fraccion).toBe(1);
    expect(objetivoDelDia([], HOY, 3).hechos).toBe(0);
  });

  it("diasCumplidos solo cuenta días con objetivo", () => {
    const lista = [...dosTests("2026-10-20"), t("2026-10-21", 50), ...dosTests("2026-10-22")];
    expect([...diasCumplidos(lista, 2)].sort()).toEqual(["2026-10-20", "2026-10-22"]);
  });

  it("racha: hoy cumple y suma", () => {
    const lista = [...dosTests(HOY), ...dosTests(sumarDias(HOY, -1)), ...dosTests(sumarDias(HOY, -2))];
    expect(racha(lista, HOY, 2)).toBe(3);
  });

  it("racha: hoy aún no cumple, no se rompe", () => {
    const lista = [t(HOY, 50), ...dosTests(sumarDias(HOY, -1)), ...dosTests(sumarDias(HOY, -2))];
    expect(racha(lista, HOY, 2)).toBe(2);
  });

  it("racha rota por un día sin cumplir", () => {
    const lista = [...dosTests(HOY), ...dosTests(sumarDias(HOY, -2)), ...dosTests(sumarDias(HOY, -3))];
    expect(racha(lista, HOY, 2)).toBe(1);
  });

  it("racha 0 si ayer tampoco cumplió", () => {
    expect(racha(dosTests(sumarDias(HOY, -2)), HOY, 2)).toBe(0);
  });

  it("los entrenos no cuentan para la racha", () => {
    const lista = [t(HOY, 50), t(HOY, 50, { modo: "entreno" })];
    expect(racha(lista, HOY, 2)).toBe(0);
  });
});

describe("resumenPorDia", () => {
  it("más reciente primero, solo días con tests y dentro del rango", () => {
    const lista = [
      t(HOY, 50, { acc: 96 }),
      t(HOY, 60, { acc: 98 }),
      t(HOY, 40, { acc: 94 }),
      t(sumarDias(HOY, -3), 45, { acc: 95 }),
      t(sumarDias(HOY, -20), 70),
      t(sumarDias(HOY, -1), 80, { modo: "entreno" }),
    ];
    const filas = resumenPorDia(lista, 14, HOY);
    expect(filas.map((f) => f.dia)).toEqual([HOY, sumarDias(HOY, -3)]);
    expect(filas[0]).toMatchObject({
      tests: 3,
      mejorWpm: 60,
      peorWpm: 40,
      medianaWpm: 50,
      mediaWpm: 50,
      mediaAcc: 96,
    });
    expect(filas[1].tests).toBe(1);
  });

  it("el último día del rango entra y el siguiente no", () => {
    const lista = [t(sumarDias(HOY, -13), 50), t(sumarDias(HOY, -14), 50)];
    expect(resumenPorDia(lista, 14, HOY)).toHaveLength(1);
  });
});

describe("tiempo y pulsaciones", () => {
  const lista = [
    t(HOY, 50, { elapsedSec: 60 }),
    t(HOY, 50, { elapsedSec: 90, modo: "entreno" }),
    t("2026-10-24", 50, { elapsedSec: 300 }),
  ];
  it("suma tests y entrenos del día", () => {
    expect(segundosDelDia(lista, HOY)).toBe(150);
    expect(segundosDelDia(lista, "2026-10-01")).toBe(0);
  });
  it("tiempoDelDia calcula la fracción con tope en 1", () => {
    expect(tiempoDelDia(lista, HOY, 5)).toMatchObject({ segundos: 150, fraccion: 0.5, cumplido: false });
    expect(tiempoDelDia(lista, HOY, 2).cumplido).toBe(true);
    expect(tiempoDelDia(lista, HOY, 2).fraccion).toBe(1);
  });
  it("pulsacionesTotales suma aciertos y errores de todos los intentos", () => {
    const a = [t(HOY, 50, { correct: 100, errors: 5 }), t(HOY, 50, { correct: 40, errors: 0, modo: "entreno" })];
    expect(pulsacionesTotales(a)).toBe(145);
    expect(pulsacionesTotales([])).toBe(0);
  });
});
