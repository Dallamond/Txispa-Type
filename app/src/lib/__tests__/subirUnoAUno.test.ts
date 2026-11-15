import { describe, expect, it } from "vitest";
import type { Intento } from "../../types";
import { subirUnoAUno } from "../sincronizacion";
import { intentoDePrueba } from "./ayudas";

const denegado = Object.assign(new Error("denegado"), { code: "permission-denied" });
const esDenegado = (e: unknown) => e === denegado;

function nube(rechazados: string[], existentes: string[]) {
  const subidos: string[] = [];
  return {
    subidos,
    crear: async (i: Intento) => {
      if (rechazados.includes(i.id) || existentes.includes(i.id)) throw denegado;
      subidos.push(i.id);
    },
    existe: async (i: Intento) => existentes.includes(i.id),
  };
}

describe("subirUnoAUno", () => {
  const [a, b, c] = ["a", "b", "c"].map((id) => intentoDePrueba(id, "2026-11-15"));

  it("sube los nuevos y da por subido el que ya existía", async () => {
    const n = nube([], ["b"]);
    await subirUnoAUno([a, b, c], n.crear, n.existe, esDenegado);
    expect(n.subidos).toEqual(["a", "c"]);
  });

  it("lanza si las reglas rechazan un intento que no está en la nube", async () => {
    const n = nube(["b"], []);
    await expect(subirUnoAUno([a, b, c], n.crear, n.existe, esDenegado)).rejects.toBe(denegado);
    expect(n.subidos).toEqual(["a"]);
  });

  it("lanza los errores que no son de permisos sin consultar la nube", async () => {
    const red = new Error("red");
    let consultas = 0;
    await expect(
      subirUnoAUno([a], async () => { throw red; }, async () => { consultas++; return true; }, esDenegado),
    ).rejects.toBe(red);
    expect(consultas).toBe(0);
  });
});
