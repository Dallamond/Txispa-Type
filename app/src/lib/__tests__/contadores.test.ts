// Los contadores se prueban contra una "nube" falsa en memoria con `increment` real (suma, no sobrescribe).

import { describe, expect, it } from "vitest";
import type { AlmacenClaveValor } from "../ajustes";
import { CLAVE_CALENTAMIENTO, CLAVE_TIEMPO_EXTRA } from "../contador";
import {
  CLAVE_MIGRADO,
  CLAVE_PENDIENTES,
  crearContadoresLocal,
  crearContadoresSincronizados,
  leerMarcaMigrado,
  leerPendientes,
  restarSubido,
} from "../contadores";
import type { IncrementosContadores, RemotoContadores } from "../sincronizacion";

const HOY = "2026-11-15";

interface Nube {
  calentamientoPuls: number;
  extraSeg: Record<string, number>;
  escrituras: IncrementosContadores[];
}
const nubeVacia = (): Nube => ({ calentamientoPuls: 0, extraSeg: {}, escrituras: [] });

function remotoFalso(nube: Nube, estado = { caida: false }): RemotoContadores {
  return {
    async leerContadores(dia) {
      if (estado.caida) throw new Error("sin red");
      return { calentamientoPuls: nube.calentamientoPuls, extraSeg: nube.extraSeg[dia] ?? 0 };
    },
    async sumarContadores(inc) {
      if (estado.caida) throw new Error("sin red");
      nube.escrituras.push(inc);
      nube.calentamientoPuls += inc.calentamientoPuls;
      for (const [d, s] of Object.entries(inc.extraSeg)) nube.extraSeg[d] = (nube.extraSeg[d] ?? 0) + s;
    },
  };
}

function kvFalso(inicial: Record<string, string> = {}): AlmacenClaveValor & { datos: Record<string, string> } {
  const datos = { ...inicial };
  return { datos, getItem: (k) => datos[k] ?? null, setItem: (k, v) => void (datos[k] = v) };
}

const conLocal = (cal: number, extra = 0) =>
  kvFalso({
    ...(cal > 0 ? { [CLAVE_CALENTAMIENTO]: String(cal) } : {}),
    ...(extra > 0 ? { [CLAVE_TIEMPO_EXTRA]: JSON.stringify({ dia: HOY, segundos: extra }) } : {}),
  });

const esperar = () => new Promise((r) => setTimeout(r, 0));

describe("backend local", () => {
  it("suma, avisa a los suscritos y reacciona a cambios", () => {
    const kv = kvFalso();
    const c = crearContadoresLocal(kv);
    let avisos = 0;
    c.suscribir(() => avisos++);
    expect(c.sumarCalentamiento(100)).toBe(100);
    expect(c.sumarTiempoExtra(HOY, 30)).toBe(30);
    expect(c.calentamiento()).toBe(100);
    expect(c.tiempoExtra(HOY)).toBe(30);
    expect(avisos).toBe(2);
    c.fijarCalentamiento(500);
    expect(c.calentamiento()).toBe(500);
    expect(avisos).toBe(3);
  });
});

describe("sin sesión", () => {
  it("se comporta como el local de siempre y no deja pendientes", () => {
    const kv = kvFalso();
    const c = crearContadoresSincronizados(kv);
    c.sumarCalentamiento(40);
    c.sumarTiempoExtra(HOY, 12);
    expect(c.calentamiento()).toBe(40);
    expect(c.tiempoExtra(HOY)).toBe(12);
    expect(kv.datos[CLAVE_PENDIENTES]).toBeUndefined();
    expect(kv.datos[CLAVE_MIGRADO]).toBeUndefined();
  });
});

describe("migración local -> nube", () => {
  it("sube lo local una sola vez y marca; reconectar no repite increments", async () => {
    const nube = nubeVacia();
    const kv = conLocal(1000, 90);
    const c = crearContadoresSincronizados(kv);
    await c.conectar(remotoFalso(nube), "u1", HOY);
    expect(nube.calentamientoPuls).toBe(1000);
    expect(nube.extraSeg[HOY]).toBe(90);
    expect(leerMarcaMigrado(kv)?.uid).toBe("u1");
    expect(c.calentamiento()).toBe(1000);
    // Reconexión (y un segundo arranque con el mismo almacén): no hay nada pendiente.
    await c.conectar(remotoFalso(nube), "u1", HOY);
    const c2 = crearContadoresSincronizados(kv);
    await c2.conectar(remotoFalso(nube), "u1", HOY);
    expect(nube.calentamientoPuls).toBe(1000);
    expect(nube.extraSeg[HOY]).toBe(90);
    expect(nube.escrituras).toHaveLength(1);
  });

  it("si la subida falla, el pendiente se conserva y se reintenta sin duplicar", async () => {
    const nube = nubeVacia();
    const red = { caida: false };
    const kv = conLocal(300);
    const c = crearContadoresSincronizados(kv);
    red.caida = true;
    await c.conectar(remotoFalso(nube, red), "u1", HOY).catch(() => undefined);
    expect(nube.calentamientoPuls).toBe(0);
    expect(leerPendientes(kv).calentamientoPuls).toBe(300);
    expect(c.calentamiento()).toBe(300); // el total local no se pierde
    red.caida = false;
    await c.sincronizar(HOY);
    await c.sincronizar(HOY);
    expect(nube.calentamientoPuls).toBe(300);
    expect(c.calentamiento()).toBe(300);
  });
});

describe("totales entre dispositivos", () => {
  it("dos dispositivos suman y ambos ven la suma coherente", async () => {
    const nube = nubeVacia();
    const a = crearContadoresSincronizados(conLocal(100, 10));
    const b = crearContadoresSincronizados(conLocal(50, 5));
    await a.conectar(remotoFalso(nube), "u1", HOY);
    await b.conectar(remotoFalso(nube), "u1", HOY);
    // Cada uno migró lo suyo: la nube tiene 150 y 15, y B ya lo ve.
    expect(nube.calentamientoPuls).toBe(150);
    expect(b.calentamiento()).toBe(150);
    expect(b.tiempoExtra(HOY)).toBe(15);
    a.sumarCalentamiento(20);
    b.sumarTiempoExtra(HOY, 7);
    await esperar();
    await a.sincronizar(HOY);
    await b.sincronizar(HOY);
    await a.sincronizar(HOY);
    expect(nube.calentamientoPuls).toBe(170);
    expect(nube.extraSeg[HOY]).toBe(22);
    expect(a.calentamiento()).toBe(170);
    expect(b.calentamiento()).toBe(170);
    expect(a.tiempoExtra(HOY)).toBe(22);
    expect(b.tiempoExtra(HOY)).toBe(22);
  });

  it("suma offline, no se pierde y se sube al volver la red (aditivo)", async () => {
    const nube = nubeVacia();
    const red = { caida: false };
    const a = crearContadoresSincronizados(kvFalso());
    const b = crearContadoresSincronizados(kvFalso());
    await a.conectar(remotoFalso(nube, red), "u1", HOY);
    await b.conectar(remotoFalso(nube, red), "u1", HOY);
    red.caida = true;
    a.sumarCalentamiento(10);
    b.sumarCalentamiento(25);
    await esperar();
    expect(nube.calentamientoPuls).toBe(0);
    red.caida = false;
    await a.sincronizar(HOY);
    await b.sincronizar(HOY);
    await a.sincronizar(HOY);
    expect(nube.calentamientoPuls).toBe(35);
    expect(a.calentamiento()).toBe(35);
    expect(b.calentamiento()).toBe(35);
  });

  it("avisa a los suscritos cuando llegan totales de la nube", async () => {
    const nube = nubeVacia();
    nube.calentamientoPuls = 999;
    const c = crearContadoresSincronizados(kvFalso());
    let avisos = 0;
    c.suscribir(() => avisos++);
    await c.conectar(remotoFalso(nube), "u1", HOY);
    expect(c.calentamiento()).toBe(999);
    expect(avisos).toBeGreaterThan(0);
  });
});

describe("otra cuenta", () => {
  it("no sube a la cuenta nueva lo pendiente de la anterior", async () => {
    const nube1 = nubeVacia();
    const nube2 = nubeVacia();
    nube2.calentamientoPuls = 7;
    const kv = kvFalso();
    const c = crearContadoresSincronizados(kv);
    await c.conectar(remotoFalso(nube1), "u1", HOY);
    c.desconectar();
    c.sumarCalentamiento(60); // queda pendiente de u1
    await c.conectar(remotoFalso(nube2), "u2", HOY);
    expect(nube2.calentamientoPuls).toBe(7);
    expect(c.calentamiento()).toBe(7);
  });
});

describe("restarSubido", () => {
  it("conserva lo sumado mientras se subía", () => {
    const p = { uid: "u", calentamientoPuls: 30, extraSeg: { [HOY]: 10, "2026-11-14": 5 } };
    const r = restarSubido(p, { calentamientoPuls: 20, extraSeg: { "2026-11-14": 5 } });
    expect(r).toEqual({ uid: "u", calentamientoPuls: 10, extraSeg: { [HOY]: 10 } });
  });
});
