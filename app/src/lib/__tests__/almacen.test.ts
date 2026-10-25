import { describe, it, expect, vi } from "vitest";
import { crearAlmacenMemoria } from "../almacen";
import { intentoDePrueba } from "./ayudas";

describe("almacén en memoria", () => {
  it("lista los intentos ordenados por fecha", async () => {
    const s = crearAlmacenMemoria();
    await s.add(intentoDePrueba("b", "2026-10-25T10:00:00Z"));
    await s.add(intentoDePrueba("a", "2026-10-24T10:00:00Z"));
    expect((await s.list()).map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("add con el mismo id reemplaza, no duplica", async () => {
    const s = crearAlmacenMemoria();
    await s.add(intentoDePrueba("a", "2026-10-24T10:00:00Z", { wpm: 40 }));
    await s.add(intentoDePrueba("a", "2026-10-24T10:00:00Z", { wpm: 55 }));
    const todos = await s.list();
    expect(todos).toHaveLength(1);
    expect(todos[0].wpm).toBe(55);
  });

  it("importMany fusiona por id y cuenta solo los nuevos", async () => {
    const s = crearAlmacenMemoria([intentoDePrueba("a", "2026-10-24T10:00:00Z")]);
    const nuevos = await s.importMany([
      intentoDePrueba("a", "2026-10-24T10:00:00Z"),
      intentoDePrueba("b", "2026-10-25T10:00:00Z"),
    ]);
    expect(nuevos).toBe(1);
    expect(await s.list()).toHaveLength(2);
  });

  it("clear vacía el almacén", async () => {
    const s = crearAlmacenMemoria([intentoDePrueba("a", "2026-10-24T10:00:00Z")]);
    await s.clear();
    expect(await s.list()).toEqual([]);
  });

  it("subscribe avisa tras cada cambio y se puede cancelar", async () => {
    const s = crearAlmacenMemoria();
    const fn = vi.fn();
    const baja = s.subscribe(fn);
    await s.add(intentoDePrueba("a", "2026-10-24T10:00:00Z"));
    await s.clear();
    expect(fn).toHaveBeenCalledTimes(2);
    baja();
    await s.add(intentoDePrueba("b", "2026-10-25T10:00:00Z"));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("importMany sin nada nuevo no avisa", async () => {
    const s = crearAlmacenMemoria([intentoDePrueba("a", "2026-10-24T10:00:00Z")]);
    const fn = vi.fn();
    s.subscribe(fn);
    await s.importMany([intentoDePrueba("a", "2026-10-24T10:00:00Z")]);
    expect(fn).not.toHaveBeenCalled();
  });
});
