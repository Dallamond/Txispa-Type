import { describe, it, expect } from "vitest";
import {
  AJUSTES_POR_DEFECTO,
  CLAVE_AJUSTES,
  cargarAjustes,
  guardarAjustes,
  normalizarAjustes,
  type AlmacenClaveValor,
} from "../ajustes";

function almacenFalso(inicial: Record<string, string> = {}): AlmacenClaveValor & { datos: Record<string, string> } {
  const datos = { ...inicial };
  return {
    datos,
    getItem: (k) => (k in datos ? datos[k] : null),
    setItem: (k, v) => {
      datos[k] = v;
    },
  };
}

describe("ajustes", () => {
  it("sin nada guardado devuelve los valores por defecto", () => {
    expect(cargarAjustes(almacenFalso())).toEqual(AJUSTES_POR_DEFECTO);
    expect(cargarAjustes(null)).toEqual(AJUSTES_POR_DEFECTO);
  });

  it("guardar y cargar es un viaje de ida y vuelta", () => {
    const a = almacenFalso();
    const ajustes = { ...AJUSTES_POR_DEFECTO, tema: "claro" as const, objetivoTests: 5, duracionPorDefecto: 120 as const };
    guardarAjustes(a, ajustes);
    expect(cargarAjustes(a)).toEqual(ajustes);
  });

  it("la clave empieza por txispatype.", () => {
    expect(CLAVE_AJUSTES.startsWith("txispatype.")).toBe(true);
  });

  it("JSON roto vuelve a los valores por defecto", () => {
    expect(cargarAjustes(almacenFalso({ [CLAVE_AJUSTES]: "{no es json" }))).toEqual(AJUSTES_POR_DEFECTO);
  });

  it("campos inválidos se corrigen sin perder los válidos", () => {
    const n = normalizarAjustes({
      tema: "azul",
      zoom: 99,
      objetivoTests: -4,
      objetivoMinutos: 9999,
      duracionPorDefecto: 45,
      rutinaCalentamiento: "completa",
      ollamaUrl: "   ",
      guiaDedos: "sí",
    });
    expect(n.tema).toBe("oscuro");
    expect(n.zoom).toBe(1.6);
    expect(n.objetivoTests).toBe(1);
    expect(n.objetivoMinutos).toBe(240);
    expect(n.duracionPorDefecto).toBe(60);
    expect(n.rutinaCalentamiento).toBe("completa");
    expect(n.ollamaUrl).toBe(AJUSTES_POR_DEFECTO.ollamaUrl);
    expect(n.guiaDedos).toBe(true);
  });

  it("si setItem lanza, no rompe", () => {
    const roto: AlmacenClaveValor = {
      getItem: () => null,
      setItem: () => {
        throw new Error("cuota");
      },
    };
    expect(() => guardarAjustes(roto, AJUSTES_POR_DEFECTO)).not.toThrow();
  });
});
