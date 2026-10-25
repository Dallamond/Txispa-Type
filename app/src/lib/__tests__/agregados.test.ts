import { describe, it, expect } from "vitest";
import {
  acumuladorVacio,
  claveTecla,
  congelar,
  cortarCadena,
  ESPACIO,
  registrarFaltas,
  registrarPulsacion,
} from "../agregados";

/** Teclea `texto` esperando `texto`, con `gap` ms entre pulsaciones. */
function teclear(texto: string, gap = 100, t0 = 1000) {
  const ac = acumuladorVacio();
  [...texto].forEach((ch, i) => registrarPulsacion(ac, ch, ch, t0 + i * gap));
  return ac;
}

describe("claveTecla", () => {
  it("minúscula y espacio como ␣", () => {
    expect(claveTecla("A")).toBe("a");
    expect(claveTecla("Ñ")).toBe("ñ");
    expect(claveTecla(" ")).toBe(ESPACIO);
  });
});

describe("tiempos por tecla y por par", () => {
  it("la primera pulsación no tiene intervalo", () => {
    const ac = teclear("a");
    expect(ac.teclas["a"]).toEqual({ n: 1, e: 0, ms: 0, msN: 0 });
    expect(ac.intervalos).toEqual([]);
  });

  it("suma el intervalo a la tecla esperada y al par", () => {
    const ac = teclear("hola", 100);
    expect(ac.teclas["o"]).toEqual({ n: 1, e: 0, ms: 100, msN: 1 });
    expect(ac.pares["ho"]).toEqual({ n: 1, ms: 100 });
    expect(ac.pares["la"]).toEqual({ n: 1, ms: 100 });
    expect(ac.intervalos).toEqual([100, 100, 100]);
  });

  it("el espacio entra en los pares como ␣", () => {
    const ac = teclear("a b", 100);
    expect(ac.pares[`a${ESPACIO}`]).toEqual({ n: 1, ms: 100 });
    expect(ac.pares[`${ESPACIO}b`]).toEqual({ n: 1, ms: 100 });
  });

  it("los signos no forman pares pero sí intervalos de tecla", () => {
    const ac = teclear("a,b", 100);
    expect(Object.keys(ac.pares)).toEqual([]);
    expect(ac.teclas[","].msN).toBe(1);
  });

  it("las pausas largas (más de 2 s) se descartan", () => {
    const ac = acumuladorVacio();
    registrarPulsacion(ac, "a", "a", 0);
    registrarPulsacion(ac, "b", "b", 2500);
    expect(ac.intervalos).toEqual([]);
    expect(ac.teclas["b"].msN).toBe(0);
    expect(ac.teclas["b"].n).toBe(1);
  });

  it("acentos y ñ se agregan en minúscula", () => {
    const ac = teclear("Año", 80);
    expect(Object.keys(ac.teclas).sort()).toEqual(["a", "o", "ñ"]);
  });
});

describe("errores y confusiones", () => {
  it("un fallo suma error y confusión, y corta la cadena", () => {
    const ac = acumuladorVacio();
    registrarPulsacion(ac, "v", "b", 0);
    registrarPulsacion(ac, "a", "a", 100);
    expect(ac.teclas["v"]).toEqual({ n: 1, e: 1, ms: 0, msN: 0 });
    expect(ac.confusiones).toEqual({ "v>b": 1 });
    // la "a" viene justo después de un fallo: sin intervalo
    expect(ac.teclas["a"].msN).toBe(0);
    expect(ac.intervalos).toEqual([]);
  });

  it("la confusión se guarda en minúscula", () => {
    const ac = acumuladorVacio();
    registrarPulsacion(ac, "V", "B", 0);
    expect(ac.confusiones).toEqual({ "v>b": 1 });
  });

  it("las confusiones se acumulan", () => {
    const ac = acumuladorVacio();
    registrarPulsacion(ac, "x", "z", 0);
    registrarPulsacion(ac, "x", "z", 300);
    expect(ac.confusiones["x>z"]).toBe(2);
  });

  it("letras que faltan: error sin confusión y sin intervalo", () => {
    const ac = acumuladorVacio();
    registrarPulsacion(ac, "a", "a", 0);
    registrarFaltas(ac, "bc");
    expect(ac.teclas["b"]).toEqual({ n: 1, e: 1, ms: 0, msN: 0 });
    expect(ac.teclas["c"]).toEqual({ n: 1, e: 1, ms: 0, msN: 0 });
    expect(ac.confusiones).toEqual({});
    registrarPulsacion(ac, " ", " ", 100);
    expect(ac.intervalos).toEqual([]);
  });

  it("cortarCadena evita que el tiempo de corregir cuente", () => {
    const ac = acumuladorVacio();
    registrarPulsacion(ac, "a", "a", 0);
    cortarCadena(ac, 50);
    registrarPulsacion(ac, "b", "b", 150);
    expect(ac.intervalos).toEqual([]);
  });
});

describe("congelar", () => {
  it("devuelve una copia independiente", () => {
    const ac = teclear("ab");
    const c = congelar(ac);
    ac.teclas["a"].n = 99;
    expect(c.teclas["a"].n).toBe(1);
  });
});
