// Servicio de contadores (pulsaciones de calentamiento y tiempo extra del día) con dos backends:
//  - local: localStorage, con las mismas claves y formato de siempre (`lib/contador.ts`).
//  - nube: Firestore con `increment` (`users/{uid}/contadores/global` y `users/{uid}/dias/{fecha}.extraSeg`).
//
// Modelo aditivo: lo que se suma aquí se anota como "pendiente" y se sube con `increment`; lo mostrado es
// `total de la nube + pendiente`, así que dos dispositivos que suman por separado ven la misma suma al sincronizar.
// La migración local -> nube es única por navegador (marca `txispatype.migrado.v1`): lo que había antes de la
// primera conexión pasa a pendiente una sola vez, y el total mostrado nunca se cuenta dos veces.
// Sin sesión no se sube nada y todo se comporta como antes.

import type { AlmacenClaveValor } from "./ajustes";
import {
  CLAVE_CALENTAMIENTO,
  CLAVE_TIEMPO_EXTRA,
  leerPulsacionesCalentamiento,
  leerTiempoExtra,
  sumarPulsacionesCalentamiento,
  sumarTiempoExtra,
} from "./contador";
import type { IncrementosContadores, RemotoContadores } from "./sincronizacion";

export const CLAVE_PENDIENTES = "txispatype.contadores.v1";
export const CLAVE_MIGRADO = "txispatype.migrado.v1";

/** Lo que cualquier backend de contadores sabe hacer. */
export interface Contadores {
  calentamiento(): number;
  tiempoExtra(hoy: string): number;
  /** Suma y devuelve el total nuevo. */
  sumarCalentamiento(n: number): number;
  sumarTiempoExtra(hoy: string, segundos: number): number;
  /** Avisa de cualquier cambio (propio o llegado de la nube). Devuelve la baja. */
  suscribir(aviso: () => void): () => void;
}

/** Backend local: `localStorage`. */
export function crearContadoresLocal(kv: AlmacenClaveValor | null): Contadores & {
  fijarCalentamiento(n: number): void;
  fijarTiempoExtra(dia: string, segundos: number): void;
} {
  const oyentes = new Set<() => void>();
  const avisar = () => oyentes.forEach((fn) => fn());
  return {
    calentamiento: () => leerPulsacionesCalentamiento(kv),
    tiempoExtra: (hoy) => leerTiempoExtra(kv, hoy),
    sumarCalentamiento(n) {
      const t = sumarPulsacionesCalentamiento(kv, n);
      avisar();
      return t;
    },
    sumarTiempoExtra(hoy, s) {
      const t = sumarTiempoExtra(kv, hoy, s);
      avisar();
      return t;
    },
    suscribir(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
    fijarCalentamiento(n) {
      try {
        kv?.setItem(CLAVE_CALENTAMIENTO, JSON.stringify(Math.max(0, Math.floor(n))));
      } catch {
        // Almacenamiento lleno o bloqueado: el total se rehace en la próxima sincronización.
      }
      avisar();
    },
    fijarTiempoExtra(dia, segundos) {
      try {
        kv?.setItem(CLAVE_TIEMPO_EXTRA, JSON.stringify({ dia, segundos: Math.max(0, Math.floor(segundos)) }));
      } catch {
        // Ídem.
      }
      avisar();
    },
  };
}

/** Sumas hechas aquí y todavía no subidas. `uid` es la cuenta a la que pertenecen. */
export interface Pendientes {
  uid: string | null;
  calentamientoPuls: number;
  extraSeg: Record<string, number>;
}

const pendientesVacios = (uid: string | null = null): Pendientes => ({ uid, calentamientoPuls: 0, extraSeg: {} });
const entero = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0);

export function leerPendientes(kv: AlmacenClaveValor | null): Pendientes {
  if (!kv) return pendientesVacios();
  try {
    const v = JSON.parse(kv.getItem(CLAVE_PENDIENTES) ?? "null") as Partial<Pendientes> | null;
    if (!v || typeof v !== "object") return pendientesVacios();
    const extraSeg: Record<string, number> = {};
    if (v.extraSeg && typeof v.extraSeg === "object") {
      for (const [dia, s] of Object.entries(v.extraSeg)) if (/^\d{4}-\d{2}-\d{2}$/.test(dia) && entero(s) > 0) extraSeg[dia] = entero(s);
    }
    return { uid: typeof v.uid === "string" ? v.uid : null, calentamientoPuls: entero(v.calentamientoPuls), extraSeg };
  } catch {
    return pendientesVacios();
  }
}

function guardarPendientes(kv: AlmacenClaveValor | null, p: Pendientes): void {
  try {
    kv?.setItem(CLAVE_PENDIENTES, JSON.stringify(p));
  } catch {
    // Almacenamiento lleno o bloqueado: lo no subido de esta sesión se pierde para la nube, no para el total local.
  }
}

/** Marca de migración: `uid` de la cuenta a la que se subió lo que había en este navegador; null si aún no se ha hecho. */
export function leerMarcaMigrado(kv: AlmacenClaveValor | null): { uid: string; fecha: string } | null {
  if (!kv) return null;
  try {
    const v = JSON.parse(kv.getItem(CLAVE_MIGRADO) ?? "null") as { uid?: unknown; fecha?: unknown } | null;
    return v && typeof v.uid === "string" ? { uid: v.uid, fecha: typeof v.fecha === "string" ? v.fecha : "" } : null;
  } catch {
    return null;
  }
}

/** ¿Hay algo que subir? */
export const hayPendientes = (p: Pendientes): boolean => p.calentamientoPuls > 0 || Object.keys(p.extraSeg).length > 0;

/** Resta lo ya subido a lo pendiente (lo sumado mientras se subía se conserva). Pura. */
export function restarSubido(p: Pendientes, subido: IncrementosContadores): Pendientes {
  const extraSeg: Record<string, number> = {};
  for (const [dia, s] of Object.entries(p.extraSeg)) {
    const resto = s - (subido.extraSeg[dia] ?? 0);
    if (resto > 0) extraSeg[dia] = resto;
  }
  return { uid: p.uid, calentamientoPuls: Math.max(0, p.calentamientoPuls - subido.calentamientoPuls), extraSeg };
}

export interface ContadoresSincronizados extends Contadores {
  /** Conecta la cuenta `uid`: migra lo local una sola vez, sube lo pendiente y trae los totales de la nube. */
  conectar(remoto: RemotoContadores, uid: string, hoy: string): Promise<void>;
  desconectar(): void;
  /** Sube lo pendiente y refresca los totales (al volver la red o la pestaña). */
  sincronizar(hoy: string): Promise<void>;
}

const sinConexion = () => typeof navigator !== "undefined" && navigator.onLine === false;

export function crearContadoresSincronizados(kv: AlmacenClaveValor | null): ContadoresSincronizados {
  const local = crearContadoresLocal(kv);
  let remoto: RemotoContadores | null = null;
  let uid: string | null = null;
  let cola: Promise<void> = Promise.resolve();
  const enCola = (fn: () => Promise<void>): Promise<void> => {
    const sig = cola.then(fn, fn);
    cola = sig.catch(() => undefined);
    return sig;
  };

  /** Anota una suma como pendiente. Antes de migrar no se anota: la migración la recogerá del total local. */
  function anotar(calentamientoPuls: number, dia: string | null, segundos: number): void {
    const marca = leerMarcaMigrado(kv);
    if (!marca) return;
    let p = leerPendientes(kv);
    if (p.uid !== marca.uid) p = pendientesVacios(marca.uid);
    if (calentamientoPuls > 0) p.calentamientoPuls += calentamientoPuls;
    if (dia && segundos > 0) p.extraSeg[dia] = (p.extraSeg[dia] ?? 0) + segundos;
    guardarPendientes(kv, p);
  }

  async function subirPendientes(r: RemotoContadores): Promise<void> {
    const p = leerPendientes(kv);
    if (p.uid !== uid || !hayPendientes(p)) return;
    const subida: IncrementosContadores = { calentamientoPuls: p.calentamientoPuls, extraSeg: { ...p.extraSeg } };
    await r.sumarContadores(subida);
    // Si la app se cierra justo aquí, el siguiente arranque repetiría estos incrementos: ventana de milisegundos, aceptada.
    guardarPendientes(kv, restarSubido(leerPendientes(kv), subida));
  }

  async function traerTotales(r: RemotoContadores, hoy: string): Promise<void> {
    const nube = await r.leerContadores(hoy);
    const p = leerPendientes(kv);
    const propios = p.uid === uid ? p : pendientesVacios(uid);
    local.fijarCalentamiento(nube.calentamientoPuls + propios.calentamientoPuls);
    local.fijarTiempoExtra(hoy, nube.extraSeg + (propios.extraSeg[hoy] ?? 0));
  }

  async function sincronizarAhora(hoy: string): Promise<void> {
    if (!remoto || !uid || sinConexion()) return;
    const r = remoto;
    await subirPendientes(r);
    await traerTotales(r, hoy);
  }

  function subirYa(): void {
    const r = remoto;
    if (!r || !uid || sinConexion()) return;
    void enCola(() => subirPendientes(r)).catch(() => undefined); // si falla, sigue pendiente
  }

  return {
    calentamiento: () => local.calentamiento(),
    tiempoExtra: (hoy) => local.tiempoExtra(hoy),
    sumarCalentamiento(n) {
      const t = local.sumarCalentamiento(n);
      anotar(Math.max(0, Math.floor(n)), null, 0);
      subirYa();
      return t;
    },
    sumarTiempoExtra(hoy, s) {
      const t = local.sumarTiempoExtra(hoy, s);
      anotar(0, hoy, Math.max(0, Math.floor(s)));
      subirYa();
      return t;
    },
    suscribir: (fn) => local.suscribir(fn),
    conectar(r, id, hoy) {
      return enCola(async () => {
        remoto = r;
        uid = id;
        const marca = leerMarcaMigrado(kv);
        if (!marca) {
          // Migración única: lo que hay en este navegador pasa a pendiente (sustituye, no suma) y se marca en el mismo paso.
          const extra = local.tiempoExtra(hoy);
          guardarPendientes(kv, { uid: id, calentamientoPuls: local.calentamiento(), extraSeg: extra > 0 ? { [hoy]: extra } : {} });
          try {
            kv?.setItem(CLAVE_MIGRADO, JSON.stringify({ uid: id, fecha: hoy }));
          } catch {
            // Sin marca se repetiría la migración: mejor no subir nada que contar dos veces.
            guardarPendientes(kv, pendientesVacios(id));
          }
        } else if (leerPendientes(kv).uid !== id) {
          // Otra cuenta distinta de la que migró: sus totales mandan y lo pendiente de la anterior no se sube a esta.
          guardarPendientes(kv, pendientesVacios(id));
        }
        await sincronizarAhora(hoy);
      });
    },
    desconectar() {
      remoto = null;
      uid = null;
    },
    sincronizar: (hoy) => enCola(() => sincronizarAhora(hoy)),
  };
}

let unico: ContadoresSincronizados | null = null;
/** Los contadores de la app (uno por pestaña). Los conecta `useSincronizacion` y los usa `ContadorTecleo`. */
export function contadoresApp(kv: AlmacenClaveValor | null): ContadoresSincronizados {
  unico ??= crearContadoresSincronizados(kv);
  return unico;
}
