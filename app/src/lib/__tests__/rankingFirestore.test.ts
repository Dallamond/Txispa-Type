import { describe, expect, it } from "vitest";
import { RankingFirestore, mensajeErrorRanking, type BackendRanking, type OpLote } from "../rankingFirestore";
import { compararFilas, type FilaRanking } from "../ranking";

/** Firestore simulado: dos colecciones y lote atómico (si una operación falla no se aplica ninguna). */
class Falso implements BackendRanking {
  publico = new Map<string, FilaRanking>();
  alias = new Map<string, string>();
  lotes: OpLote[][] = [];
  falla: unknown = null;

  async leerPerfil(uid: string) {
    return this.publico.get(uid) ?? null;
  }
  async leerReserva(clave: string) {
    return this.alias.get(clave) ?? null;
  }
  async lote(ops: OpLote[]) {
    if (this.falla) throw this.falla;
    // Como las reglas: crear una reserva ya existente sería un update, y está prohibido.
    for (const op of ops) if (op.tipo === "poner" && op.coleccion === "alias" && this.alias.has(op.id)) throw { code: "permission-denied" };
    this.lotes.push(ops);
    for (const op of ops) {
      if (op.coleccion === "publico") {
        if (op.tipo === "poner") this.publico.set(op.id, op.datos);
        else this.publico.delete(op.id);
      } else if (op.tipo === "poner") this.alias.set(op.id, op.datos.uid);
      else this.alias.delete(op.id);
    }
  }
  async listar(n: number) {
    return [...this.publico.values()].sort(compararFilas).slice(0, n);
  }
  async contarMejores(w: number) {
    return [...this.publico.values()].filter((f) => f.mejorWpm > w).length;
  }
}

const fila = (alias: string, mejorWpm = 60): FilaRanking => ({ alias, mejorWpm, accMejor: 97, tests: 5 });
const con = (f: Falso, uid: string | null) => new RankingFirestore(async () => f, uid);

describe("RankingFirestore", () => {
  it("publica perfil y reserva en un solo lote", async () => {
    const f = new Falso();
    await con(f, "u1").publicar(fila("Norte"));
    expect(f.lotes).toHaveLength(1);
    expect(f.publico.get("u1")?.alias).toBe("Norte");
    expect(f.alias.get("norte")).toBe("u1");
  });

  it("alias ocupado por otra persona (sin distinguir mayúsculas): error y nada escrito", async () => {
    const f = new Falso();
    await con(f, "u1").publicar(fila("Norte"));
    await expect(con(f, "u2").publicar(fila("NORTE"))).rejects.toThrow("Ese alias ya está en uso.");
    expect(f.publico.has("u2")).toBe(false);
    expect(f.lotes).toHaveLength(1);
  });

  it("actualizar con el mismo alias no reescribe la reserva", async () => {
    const f = new Falso();
    const r = con(f, "u1");
    await r.publicar(fila("Norte", 50));
    await r.publicar(fila("Norte", 70));
    expect(f.publico.get("u1")?.mejorWpm).toBe(70);
    expect(f.lotes[1].some((o) => o.coleccion === "alias")).toBe(false);
  });

  it("cambiar solo mayúsculas del alias mantiene la reserva", async () => {
    const f = new Falso();
    const r = con(f, "u1");
    await r.publicar(fila("Norte"));
    await r.publicar(fila("norte"));
    expect(f.publico.get("u1")?.alias).toBe("norte");
    expect([...f.alias.keys()]).toEqual(["norte"]);
  });

  it("cambio de alias: reserva el nuevo y libera el anterior", async () => {
    const f = new Falso();
    const r = con(f, "u1");
    await r.publicar(fila("Norte"));
    await r.publicar(fila("Sur"));
    expect([...f.alias.entries()]).toEqual([["sur", "u1"]]);
    expect(await con(f, "u2").aliasLibre("Norte")).toBe(true);
  });

  it("retirar borra perfil y reserva; si no hay perfil no hace nada", async () => {
    const f = new Falso();
    const r = con(f, "u1");
    await r.retirar();
    expect(f.lotes).toHaveLength(0);
    await r.publicar(fila("Norte"));
    await r.retirar();
    expect(f.publico.size).toBe(0);
    expect(f.alias.size).toBe(0);
  });

  it("aliasLibre: libre, ocupado por otro y propio", async () => {
    const f = new Falso();
    await con(f, "u1").publicar(fila("Norte"));
    expect(await con(f, "u2").aliasLibre("norte")).toBe(false);
    expect(await con(f, "u1").aliasLibre("NORTE")).toBe(true);
    expect(await con(f, "u2").aliasLibre("Otro")).toBe(true);
  });

  it("listar ordena por ppm descendente y respeta el límite", async () => {
    const f = new Falso();
    await con(f, "a").publicar(fila("Aaa", 40));
    await con(f, "b").publicar(fila("Bbb", 80));
    await con(f, "c").publicar(fila("Ccc", 60));
    expect((await con(f, null).listar(2)).map((x) => x.alias)).toEqual(["Bbb", "Ccc"]);
  });

  it("miPuesto: cuenta los mejores más uno; null sin sesión o sin publicar", async () => {
    const f = new Falso();
    await con(f, "a").publicar(fila("Aaa", 40));
    await con(f, "b").publicar(fila("Bbb", 80));
    expect(await con(f, "a").miPuesto()).toBe(2);
    expect(await con(f, "b").miPuesto()).toBe(1);
    expect(await con(f, "z").miPuesto()).toBeNull();
    expect(await con(f, null).miPuesto()).toBeNull();
  });

  it("sin sesión no deja publicar ni retirar, con mensaje claro", async () => {
    const f = new Falso();
    await expect(con(f, null).publicar(fila("Norte"))).rejects.toThrow("iniciar sesión");
    await expect(con(f, null).retirar()).rejects.toThrow("iniciar sesión");
  });

  it("alias no válido se rechaza antes de tocar la red", async () => {
    const f = new Falso();
    await expect(con(f, "u1").publicar(fila("ab"))).rejects.toThrow("Mínimo 3");
  });

  it("errores del SDK y del arranque salen en español", async () => {
    const f = new Falso();
    f.falla = { code: "unavailable" };
    await expect(con(f, "u1").publicar(fila("Norte"))).rejects.toThrow("No hay conexión");
    const sinNube = new RankingFirestore(async () => {
      throw new Error("La nube no está configurada en esta versión.");
    }, null);
    await expect(sinNube.listar(10)).rejects.toThrow("no está configurada");
    expect(mensajeErrorRanking({ code: "permission-denied" })).toContain("permisos");
  });
});
