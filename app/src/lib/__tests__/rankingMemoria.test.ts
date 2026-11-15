import { describe, expect, it } from "vitest";
import { RankingMemoria } from "../rankingMemoria";

const perfil = (alias: string, mejorWpm: number) => ({ alias, mejorWpm, accMejor: 97, tests: 5 });

describe("RankingMemoria", () => {
  it("lista ordenada y respeta el límite", async () => {
    const r = new RankingMemoria();
    const top = await r.listar(3);
    expect(top).toHaveLength(3);
    expect(top.map((f) => f.mejorWpm)).toEqual(top.map((f) => f.mejorWpm).sort((a, b) => b - a));
  });

  it("publicar inserta en su sitio y miPuesto lo refleja", async () => {
    const r = new RankingMemoria({ filas: [perfil("uno", 80), perfil("dos", 50)] });
    expect(await r.miPuesto()).toBeNull();
    await r.publicar(perfil("Yo_", 60));
    expect(await r.miPuesto()).toBe(2);
    await r.publicar(perfil("Yo_", 90));
    expect(await r.miPuesto()).toBe(1);
    expect((await r.listar(10)).filter((f) => f.alias === "Yo_")).toHaveLength(1);
  });

  it("alias único sin distinguir mayúsculas", async () => {
    const r = new RankingMemoria({ filas: [perfil("Norte", 80)] });
    expect(await r.aliasLibre("norte")).toBe(false);
    expect(await r.aliasLibre("otro")).toBe(true);
    await expect(r.publicar(perfil("NORTE", 70))).rejects.toThrow(/en uso/);
  });

  it("mi propio alias cuenta como libre y se puede cambiar liberando el anterior", async () => {
    const r = new RankingMemoria({ filas: [] });
    await r.publicar(perfil("Antiguo", 60));
    expect(await r.aliasLibre("antiguo")).toBe(true);
    await r.publicar(perfil("Nuevo", 61));
    expect((await r.listar(10)).map((f) => f.alias)).toEqual(["Nuevo"]);
  });

  it("rechaza alias inválidos", async () => {
    const r = new RankingMemoria({ filas: [] });
    await expect(r.publicar(perfil("a b", 60))).rejects.toThrow();
  });

  it("retirar borra la fila y libera el alias", async () => {
    const r = new RankingMemoria({ filas: [] });
    await r.publicar(perfil("Yo_", 60));
    await r.retirar();
    expect(await r.listar(10)).toEqual([]);
    expect(await r.miPuesto()).toBeNull();
    expect(await r.aliasLibre("Yo_")).toBe(true);
  });

  it("fallar hace que toda operación rechace", async () => {
    const r = new RankingMemoria({ fallar: true });
    await expect(r.listar(5)).rejects.toThrow();
  });
});
