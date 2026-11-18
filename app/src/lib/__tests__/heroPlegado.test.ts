import { describe, expect, it } from "vitest";
import { CLAVE_HERO_PLEGADO, guardarHeroPlegado, leerHeroPlegado, type AlmacenClaves } from "../heroPlegado";

function memoria(): AlmacenClaves & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (c) => datos.get(c) ?? null,
    setItem: (c, v) => void datos.set(c, v),
  };
}

const roto: AlmacenClaves = {
  getItem: () => {
    throw new Error("bloqueado");
  },
  setItem: () => {
    throw new Error("bloqueado");
  },
};

describe("heroPlegado", () => {
  it("la clave empieza por txispatype.", () => {
    expect(CLAVE_HERO_PLEGADO.startsWith("txispatype.")).toBe(true);
  });

  it("en la primera visita está desplegado", () => {
    expect(leerHeroPlegado(memoria())).toBe(false);
  });

  it("recuerda plegado y desplegado", () => {
    const m = memoria();
    guardarHeroPlegado(true, m);
    expect(leerHeroPlegado(m)).toBe(true);
    guardarHeroPlegado(false, m);
    expect(leerHeroPlegado(m)).toBe(false);
  });

  it("un valor desconocido cuenta como desplegado", () => {
    const m = memoria();
    m.datos.set(CLAVE_HERO_PLEGADO, "basura");
    expect(leerHeroPlegado(m)).toBe(false);
  });

  it("sin almacenamiento o con el almacenamiento roto no lanza", () => {
    expect(leerHeroPlegado(null)).toBe(false);
    expect(leerHeroPlegado(roto)).toBe(false);
    expect(() => guardarHeroPlegado(true, roto)).not.toThrow();
    expect(() => guardarHeroPlegado(true, null)).not.toThrow();
  });
});
