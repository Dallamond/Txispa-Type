import { describe, it, expect } from "vitest";
import { MotorTecleo } from "../motor";
import { confusionesMasRepetidas, crearIntento, teclasMasFalladas } from "../intento";

describe("crearIntento", () => {
  it("rellena medidas, agregados y fecha local de Madrid", () => {
    const m = new MotorTecleo(["vaca", "roja"]);
    let t = 0;
    for (const ch of "baca roja ") {
      m.tecla(ch, t);
      t += 200;
    }
    const intento = crearIntento({
      motor: m,
      ts: t,
      config: { modo: "test", fuente: "banco", durationSec: 60, seed: 7, estricto: false },
      id: "x1",
      fecha: new Date("2026-10-25T23:30:00Z"), // 00:30 del 26 en Madrid
    });
    expect(intento.id).toBe("x1");
    expect(intento.localDate).toBe("2026-10-26");
    expect(intento.errors).toBe(1);
    expect(intento.correct).toBe(9);
    expect(intento.acc).toBe(90);
    expect(intento.confusiones).toEqual({ "v>b": 1 });
    expect(intento.teclas["v"].e).toBe(1);
    expect("ejercicioId" in intento).toBe(false);
  });

  it("incluye ejercicioId solo si hay", () => {
    const m = new MotorTecleo(["a"]);
    m.tecla("a", 0);
    const i = crearIntento({
      motor: m,
      ts: 1000,
      config: { modo: "entreno", fuente: "ejercicio", ejercicioId: "lento", durationSec: 60, seed: 1, estricto: false },
      id: "y",
      fecha: new Date(),
    });
    expect(i.ejercicioId).toBe("lento");
  });

  it("anota los hashes de la IA solo si hay", () => {
    const m = new MotorTecleo(["a"]);
    m.tecla("a", 0);
    const base = { motor: m, ts: 1000, id: "z", fecha: new Date() };
    const con = crearIntento({ ...base, config: { modo: "entreno", fuente: "ia", iaHashes: ["ab12"], durationSec: 60, seed: 1, estricto: false } });
    const sin = crearIntento({ ...base, config: { modo: "entreno", fuente: "banco", iaHashes: [], durationSec: 60, seed: 1, estricto: false } });
    expect(con.iaHashes).toEqual(["ab12"]);
    expect("iaHashes" in sin).toBe(false);
  });
});

describe("teclasMasFalladas", () => {
  it("ordena por errores y recorta", () => {
    const r = teclasMasFalladas(
      {
        a: { n: 10, e: 0, ms: 0, msN: 0 },
        v: { n: 5, e: 3, ms: 0, msN: 0 },
        x: { n: 4, e: 1, ms: 0, msN: 0 },
        b: { n: 20, e: 3, ms: 0, msN: 0 },
      },
      2
    );
    expect(r.map((x) => x.tecla)).toEqual(["v", "b"]);
  });
});

describe("confusionesMasRepetidas", () => {
  it("separa esperada y escrita", () => {
    expect(confusionesMasRepetidas({ "v>b": 3, "x>z": 5 })).toEqual([
      { esperada: "x", escrita: "z", veces: 5 },
      { esperada: "v", escrita: "b", veces: 3 },
    ]);
  });
});
