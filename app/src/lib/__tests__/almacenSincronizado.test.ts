// La sincronización se prueba contra una "nube" falsa en memoria que aplica las reglas que importan:
// los intentos no se modifican (subir uno que ya existe cuenta como subido), cada escritura recibe un
// `syncedAt` creciente y "Borrar todo" sube un contador.

import { describe, expect, it } from "vitest";
import type { Intento } from "../../types";
import type { AlmacenClaveValor } from "../ajustes";
import { crearAlmacenMemoria } from "../almacen";
import { crearAlmacenSincronizado } from "../almacenSincronizado";
import { CLAVE_SYNC, leerDatosSync, trocear, faltanEnNube, paraNube, type Remoto } from "../sincronizacion";
import { intentoDePrueba } from "./ayudas";

interface Nube {
  docs: Map<string, { intento: Intento; syncedAt: number }>;
  reloj: number;
  epoch: number;
  bajadas: number[];
}
const nubeVacia = (): Nube => ({ docs: new Map(), reloj: 1000, epoch: 0, bajadas: [] });

function remotoFalso(nube: Nube, estado: { caida: boolean } = { caida: false }): Remoto {
  const comprobar = () => {
    if (estado.caida) throw new Error("sin red");
  };
  return {
    async bajar(cursor) {
      comprobar();
      const lista = [...nube.docs.values()].filter((d) => cursor === null || d.syncedAt > cursor);
      nube.bajadas.push(lista.length);
      const mayor = lista.reduce<number | null>((m, d) => (m === null || d.syncedAt > m ? d.syncedAt : m), null);
      return { intentos: lista.map((d) => d.intento), cursor: mayor };
    },
    async subir(intentos) {
      comprobar();
      for (const i of intentos) if (!nube.docs.has(i.id)) nube.docs.set(i.id, { intento: i, syncedAt: ++nube.reloj });
    },
    async epoch() {
      comprobar();
      return nube.epoch;
    },
    async borrarTodo() {
      comprobar();
      nube.docs.clear();
      return ++nube.epoch;
    },
  };
}

function kvFalso(): AlmacenClaveValor {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}

const intento = (id: string, dia = "2026-11-10") => intentoDePrueba(id, `${dia}T10:00:00Z`);
const ids = async (almacen: { list(): Promise<Intento[]> }) => (await almacen.list()).map((i) => i.id).sort();

function dispositivo(nube: Nube, inicial: Intento[] = [], kv: AlmacenClaveValor = kvFalso(), red = { caida: false }) {
  const local = crearAlmacenMemoria(inicial);
  const { almacen, controlador } = crearAlmacenSincronizado(local, kv);
  return { local, almacen, controlador, kv, red, remoto: remotoFalso(nube, red) };
}

describe("lógica pura", () => {
  it("trocear, faltanEnNube y paraNube", () => {
    expect(trocear([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(faltanEnNube([intento("a"), intento("b")], new Set(["a"]))).toEqual(["b"]);
    expect("leccionId" in paraNube(intento("a"))).toBe(false);
    expect(paraNube({ ...intento("a"), leccionId: "html/L01.01" }).leccionId).toBe("html/L01.01");
  });
});

describe("primera conexión de una cuenta", () => {
  it("une lo local con lo de la nube en las dos direcciones", async () => {
    const nube = nubeVacia();
    const otro = dispositivo(nube, [intento("n1")]);
    await otro.controlador.conectar(otro.remoto, "u1");
    const d = dispositivo(nube, [intento("l1"), intento("l2")]);
    await d.controlador.conectar(d.remoto, "u1");
    expect(await ids(d.almacen)).toEqual(["l1", "l2", "n1"]);
    expect([...nube.docs.keys()].sort()).toEqual(["l1", "l2", "n1"]);
    expect(d.controlador.estado().tipo).toBe("sincronizado");
  });

  it("repetirla no duplica ni vuelve a subir", async () => {
    const nube = nubeVacia();
    const d = dispositivo(nube, [intento("a")]);
    await d.controlador.conectar(d.remoto, "u1");
    await d.controlador.sincronizar();
    await d.controlador.sincronizar();
    expect(nube.docs.size).toBe(1);
    expect(await ids(d.almacen)).toEqual(["a"]);
  });
});

describe("día a día", () => {
  it("un intento nuevo se sube y llega a otro dispositivo; solo se baja lo nuevo", async () => {
    const nube = nubeVacia();
    const a = dispositivo(nube);
    const b = dispositivo(nube);
    await a.controlador.conectar(a.remoto, "u1");
    await b.controlador.conectar(b.remoto, "u1");
    await a.almacen.add(intento("x1"));
    await a.controlador.sincronizar();
    nube.bajadas.length = 0;
    await b.controlador.sincronizar();
    expect(await ids(b.almacen)).toEqual(["x1"]);
    expect(nube.bajadas).toEqual([1]);
    nube.bajadas.length = 0;
    await b.controlador.sincronizar();
    expect(nube.bajadas).toEqual([0]); // el cursor evita volver a leer lo ya visto
  });

  it("sin conexión el intento queda pendiente (y sobrevive a reiniciar) y sube al volver", async () => {
    const nube = nubeVacia();
    const kv = kvFalso();
    const red = { caida: false };
    const a = dispositivo(nube, [], kv, red);
    await a.controlador.conectar(a.remoto, "u1");
    red.caida = true;
    await a.almacen.add(intento("off1"));
    await a.controlador.sincronizar();
    expect(["error", "sin-conexion"]).toContain(a.controlador.estado().tipo);
    expect(leerDatosSync(kv).pendientes).toEqual(["off1"]);
    expect(nube.docs.size).toBe(0);

    // Se cierra la pestaña y se vuelve a abrir con red: el almacén local conserva el intento y el kv, los pendientes.
    red.caida = false;
    const { almacen, controlador } = crearAlmacenSincronizado(a.local, kv);
    await controlador.conectar(remotoFalso(nube, red), "u1");
    expect([...nube.docs.keys()]).toEqual(["off1"]);
    expect(leerDatosSync(kv).pendientes).toEqual([]);
    expect(await ids(almacen)).toEqual(["off1"]);
  });

  it("un intento hecho sin sesión en un navegador nunca ligado se sube en la primera conexión", async () => {
    const nube = nubeVacia();
    const d = dispositivo(nube);
    await d.almacen.add(intento("antes"));
    expect(leerDatosSync(d.kv).pendientes).toEqual([]);
    await d.controlador.conectar(d.remoto, "u1");
    expect([...nube.docs.keys()]).toEqual(["antes"]);
  });

  it("tras cerrar sesión, lo tecleado se sube al volver a entrar con la misma cuenta", async () => {
    const nube = nubeVacia();
    const d = dispositivo(nube);
    await d.controlador.conectar(d.remoto, "u1");
    d.controlador.desconectar();
    expect(d.controlador.estado().tipo).toBe("local");
    await d.almacen.add(intento("sinsesion"));
    expect(leerDatosSync(d.kv).pendientes).toEqual(["sinsesion"]);
    await d.controlador.conectar(d.remoto, "u1");
    expect(nube.docs.has("sinsesion")).toBe(true);
  });

  it("importar un archivo sube lo importado sin romper si ya estaba en la nube", async () => {
    const nube = nubeVacia();
    const d = dispositivo(nube, [intento("a")]);
    await d.controlador.conectar(d.remoto, "u1");
    await d.almacen.importMany([intento("a"), intento("b")]);
    await d.controlador.sincronizar();
    expect([...nube.docs.keys()].sort()).toEqual(["a", "b"]);
  });
});

describe("cuentas y borrado", () => {
  it("otra cuenta en el mismo navegador pide decisión; unir sube lo local a la nueva y limpio lo borra", async () => {
    const nubeA = nubeVacia();
    const nubeB = nubeVacia();
    const d = dispositivo(nubeA, [intento("mio")]);
    await d.controlador.conectar(d.remoto, "uA");
    await d.controlador.conectar(remotoFalso(nubeB), "uB");
    expect(d.controlador.estado().tipo).toBe("cuenta-distinta");
    expect(nubeB.docs.size).toBe(0);

    await d.controlador.resolverCuentaDistinta("unir");
    expect([...nubeB.docs.keys()]).toEqual(["mio"]);

    const e = dispositivo(nubeA, [intento("mio")]);
    await e.controlador.conectar(e.remoto, "uA");
    await e.controlador.conectar(remotoFalso(nubeVacia()), "uC");
    await e.controlador.resolverCuentaDistinta("limpio");
    expect(await ids(e.almacen)).toEqual([]);
  });

  it("Borrar todo en la nube vacía la nube y los demás dispositivos al sincronizar, sin resucitar nada", async () => {
    const nube = nubeVacia();
    const a = dispositivo(nube, [intento("a1")]);
    const b = dispositivo(nube);
    await a.controlador.conectar(a.remoto, "u1");
    await b.controlador.conectar(b.remoto, "u1");
    expect(await ids(b.almacen)).toEqual(["a1"]);

    await a.controlador.borrarTodoEnNube();
    expect(nube.docs.size).toBe(0);
    expect(await ids(a.almacen)).toEqual([]);

    await b.controlador.sincronizar();
    expect(await ids(b.almacen)).toEqual([]);
    await a.controlador.sincronizar();
    await b.controlador.sincronizar();
    expect(nube.docs.size).toBe(0);
  });

  it("el estado y los pendientes se guardan bajo la clave txispatype.sync.v1", async () => {
    const nube = nubeVacia();
    const d = dispositivo(nube);
    await d.controlador.conectar(d.remoto, "u1");
    expect(d.kv.getItem(CLAVE_SYNC)).toContain('"uid":"u1"');
  });
});
