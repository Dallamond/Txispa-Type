// Sincronización de los ajustes sincronizables (`users/{uid}/ajustes/actual`). Última escritura gana, con la hora
// del servidor (`updatedAt`) como árbitro. Sin sesión no hace nada y los ajustes siguen en `txispatype.settings.v1`.
//
// Se recuerda en este navegador (`txispatype.ajustesSync.v1`):
//  - `vistoEn`: el `updatedAt` de la versión de la nube que ya está reflejada aquí.
//  - `sucioDesde`: instante (reloj local) del último cambio local aún sin subir.
// Decisión (`decidirAjustes`): si hay cambios locales sin subir y son más recientes que la nube, se suben; si no, se
// aplica lo de la nube cuando es más nuevo que lo visto. Depende de que los relojes de los dispositivos no
// difieran mucho; un desfase de segundos solo importa si se edita en dos dispositivos casi a la vez.

import type { Ajustes } from "../types";
import {
  aplicarSincronizables,
  cargarAjustes,
  extraerSincronizables,
  guardarAjustes,
  mismosSincronizables,
  tocaSincronizables,
  type AlmacenClaveValor,
} from "./ajustes";
import type { AjustesRemotos, RemotoAjustes } from "./sincronizacion";

export const CLAVE_AJUSTES_SYNC = "txispatype.ajustesSync.v1";
export const RETARDO_AJUSTES_MS = 1500;

export interface MetaAjustes {
  uid: string | null;
  vistoEn: number | null;
  sucioDesde: number | null;
}

const metaVacia = (): MetaAjustes => ({ uid: null, vistoEn: null, sucioDesde: null });

export function leerMetaAjustes(kv: AlmacenClaveValor | null): MetaAjustes {
  if (!kv) return metaVacia();
  try {
    const v = JSON.parse(kv.getItem(CLAVE_AJUSTES_SYNC) ?? "null") as Partial<MetaAjustes> | null;
    if (!v || typeof v !== "object") return metaVacia();
    const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);
    return { uid: typeof v.uid === "string" ? v.uid : null, vistoEn: num(v.vistoEn), sucioDesde: num(v.sucioDesde) };
  } catch {
    return metaVacia();
  }
}

function guardarMeta(kv: AlmacenClaveValor | null, meta: MetaAjustes): void {
  try {
    kv?.setItem(CLAVE_AJUSTES_SYNC, JSON.stringify(meta));
  } catch {
    // Almacenamiento lleno o bloqueado: se reconcilia con la nube en la próxima conexión.
  }
}

export type DecisionAjustes = "subir" | "aplicar" | "nada";

/** Qué hacer al ver la versión de la nube (`remoto`, null = no existe) frente a lo local. Pura. */
export function decidirAjustes(meta: MetaAjustes, remoto: { updatedAt: number } | null, iguales: boolean): DecisionAjustes {
  if (remoto === null) return "subir";
  if (iguales) return "nada";
  if (meta.sucioDesde !== null) return meta.sucioDesde > remoto.updatedAt ? "subir" : "aplicar";
  return meta.vistoEn === null || remoto.updatedAt > meta.vistoEn ? "aplicar" : "nada";
}

export interface SincronizadorAjustes {
  conectar(remoto: RemotoAjustes, uid: string): Promise<void>;
  desconectar(): void;
  /** Aviso de que el usuario cambió ajustes (ya guardados en local). Solo cuenta si toca algún sincronizable. */
  cambioLocal(parcial: Partial<Ajustes>): void;
  /** Aviso de ajustes que llegan de la nube y ya están guardados en local. Devuelve la baja. */
  suscribir(aviso: (ajustes: Ajustes) => void): () => void;
}

export interface OpcionesSincronizadorAjustes {
  retardoMs?: number;
  ahora?: () => number;
  /** Para tests: programa `fn` tras `ms` y devuelve la cancelación. */
  programar?: (fn: () => void, ms: number) => () => void;
}

export function crearSincronizadorAjustes(kv: AlmacenClaveValor | null, op: OpcionesSincronizadorAjustes = {}): SincronizadorAjustes {
  const retardo = op.retardoMs ?? RETARDO_AJUSTES_MS;
  const ahora = op.ahora ?? (() => Date.now());
  const programar =
    op.programar ??
    ((fn, ms) => {
      const id = setTimeout(fn, ms);
      return () => clearTimeout(id);
    });

  let meta = leerMetaAjustes(kv);
  let remoto: RemotoAjustes | null = null;
  let baja: (() => void) | null = null;
  let cancelarTemporizador: (() => void) | null = null;
  const oyentes = new Set<(a: Ajustes) => void>();
  let cola: Promise<void> = Promise.resolve();
  const enCola = (fn: () => Promise<void>): Promise<void> => {
    const sig = cola.then(fn, fn);
    cola = sig.catch(() => undefined);
    return sig;
  };
  const persistir = () => guardarMeta(kv, meta);

  async function subir(r: RemotoAjustes): Promise<void> {
    const instante = meta.sucioDesde;
    const ts = await r.escribirAjustes(extraerSincronizables(cargarAjustes(kv)));
    // Si el usuario siguió cambiando mientras se escribía, `sucioDesde` ya es otro y se conserva para la siguiente subida.
    meta = { ...meta, vistoEn: ts, sucioDesde: meta.sucioDesde === instante ? null : meta.sucioDesde };
    persistir();
  }

  function aplicar(a: AjustesRemotos): void {
    const nuevo = aplicarSincronizables(cargarAjustes(kv), a.valores);
    guardarAjustes(kv, nuevo);
    meta = { ...meta, vistoEn: a.updatedAt, sucioDesde: null };
    persistir();
    oyentes.forEach((fn) => fn(nuevo));
  }

  async function reconciliar(r: RemotoAjustes, doc: AjustesRemotos | null): Promise<void> {
    const local = cargarAjustes(kv);
    const iguales = doc !== null && mismosSincronizables(extraerSincronizables(aplicarSincronizables(local, doc.valores)), extraerSincronizables(local));
    const d = decidirAjustes(meta, doc, iguales);
    if (d === "subir") await subir(r);
    else if (d === "aplicar" && doc) aplicar(doc);
    else if (doc && iguales) {
      meta = { ...meta, vistoEn: doc.updatedAt, sucioDesde: null };
      persistir();
    }
  }

  return {
    conectar(r, id) {
      return enCola(async () => {
        baja?.();
        baja = null;
        remoto = r;
        // Otra cuenta distinta: lo visto de la anterior no vale. Sin cuenta previa se conservan los cambios locales sin subir.
        if (meta.uid !== null && meta.uid !== id) meta = { uid: id, vistoEn: null, sucioDesde: null };
        else meta = { ...meta, uid: id };
        persistir();
        await reconciliar(r, await r.leerAjustes());
        baja = r.escucharAjustes((a) => {
          if (remoto === r) void enCola(() => reconciliar(r, a)).catch(() => undefined);
        });
      });
    },
    desconectar() {
      baja?.();
      baja = null;
      cancelarTemporizador?.();
      cancelarTemporizador = null;
      remoto = null;
    },
    cambioLocal(parcial) {
      if (!tocaSincronizables(parcial)) return;
      // Sin sesión también se marca: al iniciar sesión, lo cambiado aquí es lo más reciente y sube.
      meta = { ...meta, sucioDesde: ahora() };
      persistir();
      if (!remoto) return;
      cancelarTemporizador?.();
      cancelarTemporizador = programar(() => {
        cancelarTemporizador = null;
        const r = remoto;
        if (r) void enCola(() => subir(r)).catch(() => undefined); // si falla, `sucioDesde` sigue y se reintenta al reconectar
      }, retardo);
    },
    suscribir(aviso) {
      oyentes.add(aviso);
      return () => oyentes.delete(aviso);
    },
  };
}

let unico: SincronizadorAjustes | null = null;
/** El sincronizador de la app (uno por pestaña). Lo conecta `useSincronizacion` y lo avisa `useAjustes`. */
export function sincronizadorAjustesApp(kv: AlmacenClaveValor | null): SincronizadorAjustes {
  unico ??= crearSincronizadorAjustes(kv);
  return unico;
}
