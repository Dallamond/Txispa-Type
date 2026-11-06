import { describe, it, expect } from "vitest";
import { avanceDeModulo, progresoCurso, resumenesDeLecciones, siguienteDisponible, siguienteLeccion } from "../progresoCurso";
import type { Modulo } from "../../data/curso";
import { intentoDePrueba } from "./ayudas";

const leccion = (id: string, moduloId: string, tipo: "leccion" | "repaso" = "leccion", dificultad: 1 | 2 | 3 | 4 | 5 = 1) => ({
  id,
  moduloId,
  titulo: id,
  tipo,
  dificultad,
  nuevas: [],
  explicacion: "x.",
  codigo: "a",
});

const M01: Modulo = {
  id: "M01",
  curso: "html",
  titulo: "Uno",
  descripcion: "x",
  lecciones: [leccion("L01.01", "M01"), leccion("L01.02", "M01"), leccion("L01.R", "M01", "repaso")],
};
const M02: Modulo = {
  id: "M02",
  curso: "html",
  titulo: "Dos",
  descripcion: "x",
  lecciones: [leccion("L02.01", "M02"), leccion("L02.R", "M02", "repaso")],
};
const M13: Modulo = {
  id: "M13",
  curso: "html",
  titulo: "Diccionario",
  descripcion: "x",
  lecciones: [leccion("L13.01", "M13"), leccion("L13.R", "M13", "repaso")],
};
const MODULOS = [M01, M02, M13];

let n = 0;
/** Un intento de lección. Por defecto lo supera (98 % de precisión, poco ritmo). */
const hecho = (leccionId: string, extra: Partial<Parameters<typeof intentoDePrueba>[2]> = {}, dia = "2026-11-06") =>
  intentoDePrueba(`i${n++}`, `${dia}T10:00:00Z`, { modo: "entreno", fuente: "curso", leccionId, acc: 96, wpm: 5, ...extra });

describe("progresoCurso", () => {
  it("sin intentos solo está disponible la primera lección de la ruta; el diccionario va libre", () => {
    const e = progresoCurso([], MODULOS, { libres: ["M13"] });
    expect(e.get("html/L01.01")).toBe("disponible");
    expect(e.get("html/L01.02")).toBe("bloqueada");
    expect(e.get("html/L01.R")).toBe("bloqueada");
    expect(e.get("html/L02.01")).toBe("bloqueada");
    expect(e.get("html/L13.01")).toBe("disponible");
    expect(e.get("html/L13.R")).toBe("bloqueada");
  });

  it("superar una lección abre la siguiente; un intento sin precisión suficiente no cuenta", () => {
    const flojo = progresoCurso([hecho("html/L01.01", { acc: 90 })], MODULOS);
    expect(flojo.get("html/L01.01")).toBe("disponible");
    expect(flojo.get("html/L01.02")).toBe("bloqueada");
    const bien = progresoCurso([hecho("html/L01.01")], MODULOS);
    expect(bien.get("html/L01.01")).toBe("hecha");
    expect(bien.get("html/L01.02")).toBe("disponible");
  });

  it("el primer elemento de un módulo se abre al hacer el repaso del anterior", () => {
    const hasta2 = [hecho("html/L01.01"), hecho("html/L01.02")];
    expect(progresoCurso(hasta2, MODULOS).get("html/L02.01")).toBe("bloqueada");
    const conRepaso = [...hasta2, hecho("html/L01.R")];
    expect(progresoCurso(conRepaso, MODULOS).get("html/L02.01")).toBe("disponible");
  });

  it("un módulo libre no abre ni cierra la ruta", () => {
    const soloDiccionario = [hecho("html/L13.01"), hecho("html/L13.R")];
    const e = progresoCurso(soloDiccionario, MODULOS, { libres: ["M13"] });
    expect(e.get("html/L02.01")).toBe("bloqueada");
    const hastaRepaso = [hecho("html/L01.01"), hecho("html/L01.02"), hecho("html/L01.R")];
    expect(progresoCurso(hastaRepaso, MODULOS, { libres: ["M13"] }).get("html/L02.01")).toBe("disponible");
  });

  it("desbloquearTodo deja disponibles las lecciones sin hacer", () => {
    const e = progresoCurso([hecho("html/L01.01")], MODULOS, { desbloquearTodo: true });
    expect(e.get("html/L01.01")).toBe("hecha");
    expect(e.get("html/L01.R")).toBe("disponible");
    expect(e.get("html/L02.R")).toBe("disponible");
  });

  it("lo hecho se queda hecho aunque el orden lo bloquease", () => {
    const e = progresoCurso([hecho("html/L01.02")], MODULOS);
    expect(e.get("html/L01.02")).toBe("hecha");
    expect(e.get("html/L01.01")).toBe("disponible");
  });

  it("ignora intentos que no son del curso o no tienen leccionId", () => {
    const e = progresoCurso(
      [intentoDePrueba("a", "2026-11-06T10:00:00Z", { modo: "test" }), hecho("html/L01.01", { fuente: "banco" })],
      MODULOS
    );
    expect(e.get("html/L01.01")).toBe("disponible");
  });
});

describe("dominada", () => {
  it("con 98 % y la velocidad de su dificultad basta un intento", () => {
    const rapido = progresoCurso([hecho("html/L01.01", { acc: 98, wpm: 8 })], MODULOS);
    expect(rapido.get("html/L01.01")).toBe("dominada");
    const lento = progresoCurso([hecho("html/L01.01", { acc: 98, wpm: 7.9 })], MODULOS);
    expect(lento.get("html/L01.01")).toBe("hecha");
  });

  it("el umbral de velocidad sube con la dificultad", () => {
    const dificil: Modulo = { ...M01, lecciones: [leccion("L01.01", "M01", "leccion", 5)] };
    const e = progresoCurso([hecho("html/L01.01", { acc: 99, wpm: 12 })], [dificil]);
    expect(e.get("html/L01.01")).toBe("hecha");
    const e2 = progresoCurso([hecho("html/L01.01", { acc: 99, wpm: 16 })], [dificil]);
    expect(e2.get("html/L01.01")).toBe("dominada");
  });

  it("tres días distintos superándola también la dominan, pero tres intentos el mismo día no", () => {
    const mismoDia = [hecho("html/L01.01"), hecho("html/L01.01"), hecho("html/L01.01")];
    expect(progresoCurso(mismoDia, MODULOS).get("html/L01.01")).toBe("hecha");
    const tresDias = [
      hecho("html/L01.01", {}, "2026-11-04"),
      hecho("html/L01.01", {}, "2026-11-05"),
      hecho("html/L01.01", {}, "2026-11-06"),
    ];
    expect(progresoCurso(tresDias, MODULOS).get("html/L01.01")).toBe("dominada");
  });
});

describe("resumenes y ayudas", () => {
  it("cuenta intentos y guarda la mejor precisión y el mejor ritmo entre los superados", () => {
    const r = resumenesDeLecciones([
      hecho("html/L01.01", { acc: 90, wpm: 40 }),
      hecho("html/L01.01", { acc: 96, wpm: 20 }),
      hecho("html/L01.01", { acc: 99, wpm: 30 }),
    ]).get("html/L01.01");
    expect(r).toEqual({ intentos: 3, mejorPpm: 30, mejorPrecision: 99 });
  });

  it("sin superados no hay mejor ritmo", () => {
    expect(resumenesDeLecciones([hecho("html/L01.01", { acc: 80 })]).get("html/L01.01")).toEqual({
      intentos: 1,
      mejorPpm: null,
      mejorPrecision: 80,
    });
  });

  it("siguienteDisponible salta los módulos libres y devuelve null al acabar", () => {
    const e = progresoCurso([hecho("html/L01.01")], MODULOS, { libres: ["M13"] });
    expect(siguienteDisponible(MODULOS, e, ["M13"])?.leccion.id).toBe("L01.02");
    const todo = progresoCurso([], MODULOS, { desbloquearTodo: true });
    expect(siguienteDisponible(MODULOS, todo, ["M13"])?.leccion.id).toBe("L01.01");
    const acabado = new Map([...todo].map(([k]) => [k, "hecha" as const]));
    expect(siguienteDisponible(MODULOS, acabado, ["M13"])).toBeNull();
  });

  it("avanceDeModulo cuenta hechas y dominadas", () => {
    const e = progresoCurso([hecho("html/L01.01", { acc: 99, wpm: 30 }), hecho("html/L01.02")], MODULOS);
    expect(avanceDeModulo(M01, e)).toEqual({ hechas: 2, total: 3 });
  });
});

describe("siguienteLeccion", () => {
  const libres = ["M13"];
  it("sigue dentro del módulo y, al acabarlo, pasa al siguiente de la ruta", () => {
    expect(siguienteLeccion(MODULOS, M01, M01.lecciones[0], libres)?.leccion.id).toBe("L01.02");
    const tras = siguienteLeccion(MODULOS, M01, M01.lecciones[2], libres);
    expect(tras?.modulo.id).toBe("M02");
    expect(tras?.leccion.id).toBe("L02.01");
  });

  it("no salta a un módulo libre ni sale de él", () => {
    expect(siguienteLeccion(MODULOS, M02, M02.lecciones[1], libres)).toBeNull();
    expect(siguienteLeccion(MODULOS, M13, M13.lecciones[1], libres)).toBeNull();
    expect(siguienteLeccion(MODULOS, M13, M13.lecciones[0], libres)?.leccion.id).toBe("L13.R");
  });

  it("solo ve los módulos que se le pasan", () => {
    expect(siguienteLeccion([M01, M13], M01, M01.lecciones[2], libres)).toBeNull();
  });
});
