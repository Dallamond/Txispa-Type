import { describe, it, expect } from "vitest";
import { AJUSTES_POR_DEFECTO } from "../ajustes";
import { crearAlmacenMemoria } from "../almacen";
import { crearExportacion, esIntentoValido, leerImportacion, nombreArchivo } from "../exportar";
import { intentoDePrueba } from "./ayudas";

const fecha = new Date("2026-10-25T10:00:00Z");

describe("exportar e importar", () => {
  it("el viaje de ida y vuelta conserva intentos y ajustes", () => {
    const intentos = [intentoDePrueba("a", "2026-10-24T10:00:00Z"), intentoDePrueba("b", "2026-10-25T10:00:00Z")];
    const ajustes = { ...AJUSTES_POR_DEFECTO, objetivoTests: 5 };
    const texto = JSON.stringify(crearExportacion(intentos, ajustes, fecha));
    const r = leerImportacion(texto);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.intentos).toEqual(intentos);
      expect(r.descartados).toBe(0);
      expect(r.ajustes?.objetivoTests).toBe(5);
    }
  });

  it("rechaza JSON roto y archivos de otra app", () => {
    expect(leerImportacion("{no").ok).toBe(false);
    expect(leerImportacion(JSON.stringify({ app: "otra", schema: 1, intentos: [] })).ok).toBe(false);
  });

  it("rechaza un esquema más nuevo", () => {
    expect(leerImportacion(JSON.stringify({ app: "txispa-type", schema: 99, intentos: [] })).ok).toBe(false);
  });

  it("descarta los intentos rotos pero conserva los buenos", () => {
    const bueno = intentoDePrueba("a", "2026-10-24T10:00:00Z");
    const texto = JSON.stringify({
      app: "txispa-type",
      schema: 1,
      exportedAt: fecha.toISOString(),
      intentos: [bueno, { id: "roto" }, null, { ...bueno, id: "b", wpm: "mucho" }],
    });
    const r = leerImportacion(texto);
    expect(r.ok && r.intentos).toEqual([bueno]);
    expect(r.ok && r.descartados).toBe(3);
    expect(r.ok && r.ajustes).toBeNull();
  });

  it("importar dos veces no duplica (fusión por id en el almacén)", async () => {
    const intentos = [intentoDePrueba("a", "2026-10-24T10:00:00Z")];
    const almacen = crearAlmacenMemoria();
    const r = leerImportacion(JSON.stringify(crearExportacion(intentos, AJUSTES_POR_DEFECTO, fecha)));
    if (!r.ok) throw new Error("debería importar");
    expect(await almacen.importMany(r.intentos)).toBe(1);
    expect(await almacen.importMany(r.intentos)).toBe(0);
    expect(await almacen.list()).toHaveLength(1);
  });

  it("esIntentoValido exige una fecha local con formato", () => {
    expect(esIntentoValido({ ...intentoDePrueba("a", "2026-10-24T10:00:00Z"), localDate: "ayer" })).toBe(false);
  });

  it("nombre de archivo con la fecha", () => {
    expect(nombreArchivo("2026-10-25")).toBe("txispa-type-2026-10-25.json");
  });
});
