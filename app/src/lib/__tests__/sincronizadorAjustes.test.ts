// Los ajustes se prueban contra una "nube" falsa en memoria con `updatedAt` de servidor creciente y avisos de cambios.

import { describe, expect, it } from "vitest";
import type { Ajustes, AjustesSincronizables } from "../../types";
import {
  AJUSTES_POR_DEFECTO,
  aplicarSincronizables,
  cargarAjustes,
  extraerSincronizables,
  guardarAjustes,
  mismosSincronizables,
  tocaSincronizables,
  type AlmacenClaveValor,
} from "../ajustes";
import type { AjustesRemotos, RemotoAjustes } from "../sincronizacion";
import { crearSincronizadorAjustes, decidirAjustes, leerMetaAjustes } from "../sincronizadorAjustes";

interface Nube {
  doc: AjustesRemotos | null;
  reloj: number;
  oyentes: Set<(a: AjustesRemotos) => void>;
  escrituras: number;
}
const nubeVacia = (): Nube => ({ doc: null, reloj: 10_000, oyentes: new Set(), escrituras: 0 });

/** Cambia la nube "desde otro dispositivo". */
function escribirOtro(nube: Nube, valores: Partial<AjustesSincronizables>): void {
  nube.doc = { valores: { ...extraerSincronizables(AJUSTES_POR_DEFECTO), ...(nube.doc?.valores as object), ...valores }, updatedAt: ++nube.reloj };
  nube.oyentes.forEach((fn) => fn(nube.doc!));
}

function remotoFalso(nube: Nube): RemotoAjustes {
  return {
    async leerAjustes() {
      return nube.doc;
    },
    async escribirAjustes(valores) {
      nube.escrituras++;
      nube.doc = { valores: { ...valores }, updatedAt: ++nube.reloj };
      return nube.doc.updatedAt;
    },
    escucharAjustes(aviso) {
      nube.oyentes.add(aviso);
      return () => nube.oyentes.delete(aviso);
    },
  };
}

function kvFalso(): AlmacenClaveValor {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}

/** Temporizador manual: `disparar` ejecuta lo programado. */
function reloj() {
  let pendiente: (() => void) | null = null;
  return {
    programar: (fn: () => void) => {
      pendiente = fn;
      return () => {
        if (pendiente === fn) pendiente = null;
      };
    },
    disparar: async () => {
      const fn = pendiente;
      pendiente = null;
      fn?.();
      await new Promise((r) => setTimeout(r, 0));
    },
    hayPendiente: () => pendiente !== null,
  };
}

const esperar = () => new Promise((r) => setTimeout(r, 0));
const guardar = (kv: AlmacenClaveValor, parcial: Partial<Ajustes>) => guardarAjustes(kv, { ...cargarAjustes(kv), ...parcial });

describe("subconjunto sincronizable", () => {
  it("extrae solo las claves sincronizables", () => {
    const sub = extraerSincronizables({ ...AJUSTES_POR_DEFECTO, zoom: 1.4, tema: "claro", ollamaModelo: "x", objetivoTests: 5 });
    expect(Object.keys(sub).sort()).toEqual(
      ["calentamientoMin", "duracionPorDefecto", "estrictoPorDefecto", "objetivoMinutos", "objetivoTests", "puntuacionYMayusculas", "reglasDeAjuste"],
    );
    expect(sub.objetivoTests).toBe(5);
  });

  it("aplica solo lo sincronizable y válido; los locales no se tocan", () => {
    const base: Ajustes = { ...AJUSTES_POR_DEFECTO, zoom: 1.3, tema: "claro", objetivoTests: 4 };
    const r = aplicarSincronizables(base, { objetivoTests: 8, zoom: 1.6, tema: "oscuro", ollamaUrl: "http://x", objetivoMinutos: 45 });
    expect(r.objetivoTests).toBe(8);
    expect(r.objetivoMinutos).toBe(45);
    expect(r.zoom).toBe(1.3);
    expect(r.tema).toBe("claro");
    expect(r.ollamaUrl).toBe(base.ollamaUrl);
  });

  it("un valor inválido de la nube conserva el local", () => {
    const base: Ajustes = { ...AJUSTES_POR_DEFECTO, objetivoTests: 4, duracionPorDefecto: 120, estrictoPorDefecto: true };
    const r = aplicarSincronizables(base, { objetivoTests: 9999, duracionPorDefecto: 77, estrictoPorDefecto: "sí", calentamientoMin: "5", reglasDeAjuste: false });
    expect(r.objetivoTests).toBe(4);
    expect(r.duracionPorDefecto).toBe(120);
    expect(r.estrictoPorDefecto).toBe(true);
    expect(r.calentamientoMin).toBe(base.calentamientoMin);
    expect(r.reglasDeAjuste).toBe(false); // este sí era válido
    expect(aplicarSincronizables(base, null)).toEqual(base);
  });

  it("tocaSincronizables y mismosSincronizables", () => {
    expect(tocaSincronizables({ zoom: 1 })).toBe(false);
    expect(tocaSincronizables({ zoom: 1, objetivoTests: 2 })).toBe(true);
    const a = extraerSincronizables(AJUSTES_POR_DEFECTO);
    expect(mismosSincronizables(a, { ...a })).toBe(true);
    expect(mismosSincronizables(a, { ...a, objetivoTests: 9 })).toBe(false);
  });
});

describe("decidirAjustes", () => {
  const meta = (vistoEn: number | null, sucioDesde: number | null) => ({ uid: "u", vistoEn, sucioDesde });
  it("sin documento en la nube, sube", () => expect(decidirAjustes(meta(null, null), null, false)).toBe("subir"));
  it("iguales, nada", () => expect(decidirAjustes(meta(null, 5), { updatedAt: 1 }, true)).toBe("nada"));
  it("cambio local más reciente que la nube, sube", () => expect(decidirAjustes(meta(5, 100), { updatedAt: 50 }, false)).toBe("subir"));
  it("la nube es más reciente que el cambio local, gana la nube", () => expect(decidirAjustes(meta(5, 100), { updatedAt: 200 }, false)).toBe("aplicar"));
  it("sin cambios locales aplica solo si la nube es más nueva que lo visto", () => {
    expect(decidirAjustes(meta(5, null), { updatedAt: 6 }, false)).toBe("aplicar");
    expect(decidirAjustes(meta(5, null), { updatedAt: 5 }, false)).toBe("nada");
    expect(decidirAjustes(meta(null, null), { updatedAt: 1 }, false)).toBe("aplicar");
  });
});

describe("orquestación", () => {
  it("primera conexión sin documento: sube los ajustes locales", async () => {
    const nube = nubeVacia();
    const kv = kvFalso();
    guardar(kv, { objetivoTests: 6, zoom: 1.2 });
    const s = crearSincronizadorAjustes(kv);
    await s.conectar(remotoFalso(nube), "u1");
    expect((nube.doc?.valores as AjustesSincronizables).objetivoTests).toBe(6);
    expect("zoom" in (nube.doc?.valores as object)).toBe(false);
    expect(leerMetaAjustes(kv).vistoEn).toBe(nube.doc?.updatedAt);
  });

  it("un dispositivo nuevo recibe los ajustes de la cuenta y avisa a la interfaz", async () => {
    const nube = nubeVacia();
    escribirOtro(nube, { objetivoMinutos: 90, calentamientoMin: 3 });
    const kv = kvFalso();
    guardar(kv, { zoom: 1.5 });
    const s = crearSincronizadorAjustes(kv);
    const avisos: Ajustes[] = [];
    s.suscribir((a) => avisos.push(a));
    await s.conectar(remotoFalso(nube), "u1");
    const a = cargarAjustes(kv);
    expect(a.objetivoMinutos).toBe(90);
    expect(a.calentamientoMin).toBe(3);
    expect(a.zoom).toBe(1.5);
    expect(avisos).toHaveLength(1);
  });

  it("cambio remoto en vivo se aplica; el eco del propio cambio no", async () => {
    const nube = nubeVacia();
    const kv = kvFalso();
    const t = reloj();
    const s = crearSincronizadorAjustes(kv, { programar: t.programar });
    const avisos: Ajustes[] = [];
    s.suscribir((a) => avisos.push(a));
    await s.conectar(remotoFalso(nube), "u1");
    escribirOtro(nube, { objetivoTests: 7 });
    await esperar();
    expect(cargarAjustes(kv).objetivoTests).toBe(7);
    const n = avisos.length;
    // Cambio local y subida: el documento resultante llega como eco y no vuelve a aplicarse.
    guardar(kv, { objetivoTests: 8 });
    s.cambioLocal({ objetivoTests: 8 });
    await t.disparar();
    expect((nube.doc?.valores as AjustesSincronizables).objetivoTests).toBe(8);
    nube.oyentes.forEach((fn) => fn(nube.doc!));
    await esperar();
    expect(avisos.length).toBe(n);
    expect(cargarAjustes(kv).objetivoTests).toBe(8);
  });

  it("debounce: varios cambios seguidos hacen una sola escritura; los ajustes locales no programan nada", async () => {
    const nube = nubeVacia();
    const kv = kvFalso();
    const t = reloj();
    const s = crearSincronizadorAjustes(kv, { programar: t.programar });
    await s.conectar(remotoFalso(nube), "u1");
    const base = nube.escrituras;
    s.cambioLocal({ zoom: 1.4 });
    expect(t.hayPendiente()).toBe(false);
    for (const n of [2, 3, 4]) {
      guardar(kv, { objetivoTests: n });
      s.cambioLocal({ objetivoTests: n });
    }
    expect(t.hayPendiente()).toBe(true);
    await t.disparar();
    expect(nube.escrituras - base).toBe(1);
    expect((nube.doc?.valores as AjustesSincronizables).objetivoTests).toBe(4);
    expect(leerMetaAjustes(kv).sucioDesde).toBeNull();
  });

  it("última escritura gana: un cambio local más reciente que la nube se sube al conectar", async () => {
    const nube = nubeVacia();
    escribirOtro(nube, { objetivoTests: 2 }); // updatedAt 10001
    const kv = kvFalso();
    const s0 = crearSincronizadorAjustes(kv, { ahora: () => 20_000 });
    guardar(kv, { objetivoTests: 9 });
    s0.cambioLocal({ objetivoTests: 9 }); // sin sesión: queda marcado como cambio local
    const s = crearSincronizadorAjustes(kv); // nueva carga de la app: lee la marca guardada
    await s.conectar(remotoFalso(nube), "u1");
    expect((nube.doc?.valores as AjustesSincronizables).objetivoTests).toBe(9);
  });

  it("última escritura gana: un cambio local anterior a la nube pierde", async () => {
    const nube = nubeVacia();
    const kv = kvFalso();
    const s0 = crearSincronizadorAjustes(kv, { ahora: () => 5 });
    guardar(kv, { objetivoTests: 9 });
    s0.cambioLocal({ objetivoTests: 9 });
    escribirOtro(nube, { objetivoTests: 2 }); // updatedAt 10001 > 5
    const s = crearSincronizadorAjustes(kv);
    await s.conectar(remotoFalso(nube), "u1");
    expect(cargarAjustes(kv).objetivoTests).toBe(2);
    expect((nube.doc?.valores as AjustesSincronizables).objetivoTests).toBe(2);
  });

  it("sin sesión (desconectado) no escribe nada en la nube ni escucha", async () => {
    const nube = nubeVacia();
    const kv = kvFalso();
    const t = reloj();
    const s = crearSincronizadorAjustes(kv, { programar: t.programar });
    await s.conectar(remotoFalso(nube), "u1");
    s.desconectar();
    const base = nube.escrituras;
    guardar(kv, { objetivoTests: 5 });
    s.cambioLocal({ objetivoTests: 5 });
    expect(t.hayPendiente()).toBe(false);
    expect(nube.escrituras).toBe(base);
    escribirOtro(nube, { objetivoTests: 1 });
    await esperar();
    expect(cargarAjustes(kv).objetivoTests).toBe(5);
  });
});
