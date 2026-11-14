// Almacén sincronizado: envuelve el almacén local (IndexedDB) y lo mantiene al día con la nube.
// `App` y los componentes siguen hablando con un `RunStore`; la nube es opcional y puede llegar o irse
// (iniciar y cerrar sesión) sin cambiar el almacén que usa la interfaz.
//
// - Guardar nunca espera a la red: se guarda en local y el intento queda en la lista de pendientes,
//   que se sube cuando hay sesión y conexión (y sobrevive a cerrar la pestaña).
// - Bajar es incremental: solo lo posterior al último `syncedAt` visto.
// - La primera vez que una cuenta se conecta en un navegador se comparan los ids y se sube lo que falte.

import type { Intento } from "../types";
import type { AlmacenClaveValor } from "./ajustes";
import type { RunStore } from "./almacen";
import {
  datosVacios,
  faltanEnNube,
  guardarDatosSync,
  leerDatosSync,
  trocear,
  unirIds,
  type DatosSync,
  type EstadoSync,
  type Remoto,
} from "./sincronizacion";

export interface ControladorSync {
  estado(): EstadoSync;
  suscribirEstado(fn: () => void): () => void;
  /** Conecta la cuenta `uid` con su nube y sincroniza. */
  conectar(remoto: Remoto, uid: string): Promise<void>;
  /** Cierra la sesión: los datos locales se quedan y la app sigue funcionando en local. */
  desconectar(): void;
  /** Baja lo nuevo y sube lo pendiente. */
  sincronizar(): Promise<void>;
  /** En este navegador había datos de otra cuenta: unirlos a la actual o empezar limpio (borra lo local). */
  resolverCuentaDistinta(modo: "unir" | "limpio"): Promise<void>;
  /** Borra los intentos en la nube y en este dispositivo; los demás dispositivos se vacían al sincronizar. */
  borrarTodoEnNube(): Promise<void>;
}

const sinConexion = () => typeof navigator !== "undefined" && navigator.onLine === false;

export function crearAlmacenSincronizado(
  local: RunStore,
  kv: AlmacenClaveValor | null
): { almacen: RunStore; controlador: ControladorSync } {
  let datos: DatosSync = leerDatosSync(kv);
  let remoto: Remoto | null = null;
  let uid: string | null = null;
  let estado: EstadoSync = { tipo: "local" };
  const oyentes = new Set<() => void>();
  // Todo lo que habla con la nube pasa por esta cola: una operación cada vez.
  let cola: Promise<void> = Promise.resolve();

  const poner = (e: EstadoSync) => {
    estado = e;
    oyentes.forEach((fn) => fn());
  };
  const guardar = () => guardarDatosSync(kv, datos);
  const enCola = (fn: () => Promise<void>): Promise<void> => {
    const siguiente = cola.then(fn, fn);
    cola = siguiente.catch(() => undefined);
    return siguiente;
  };
  const fallo = (e: unknown) => {
    if (sinConexion()) poner({ tipo: "sin-conexion", pendientes: datos.pendientes.length });
    else poner({ tipo: "error", mensaje: e instanceof Error ? e.message : "Error de sincronización", pendientes: datos.pendientes.length });
  };

  async function subirPendientes(r: Remoto): Promise<void> {
    if (datos.pendientes.length === 0) return;
    const locales = new Map((await local.list()).map((i) => [i.id, i] as const));
    // Un id que ya no está en local (borrado) no se sube.
    datos.pendientes = datos.pendientes.filter((id) => locales.has(id));
    const lista = datos.pendientes.map((id) => locales.get(id)!);
    for (const lote of trocear(lista)) {
      await r.subir(lote);
      const subidos = new Set(lote.map((i) => i.id));
      datos.pendientes = datos.pendientes.filter((id) => !subidos.has(id));
      guardar();
    }
  }

  async function sincronizarAhora(): Promise<void> {
    if (!remoto || !uid) {
      poner({ tipo: "local" });
      return;
    }
    const r = remoto;
    try {
      if (datos.uid !== null && datos.uid !== uid) {
        poner({ tipo: "cuenta-distinta" });
        return;
      }
      poner({ tipo: "sincronizando" });
      if (datos.uid === null) datos = { ...datosVacios(), uid };

      const ep = await r.epoch();
      if (datos.epochVisto !== null && ep > datos.epochVisto) {
        // Alguien pulsó "Borrar todo" en otro dispositivo: este también se vacía.
        await local.clear();
        datos.cursor = null;
        datos.pendientes = [];
      }
      datos.epochVisto = ep;

      const primeraBajada = datos.cursor === null;
      const { intentos: nuevos, cursor } = await r.bajar(datos.cursor);
      if (nuevos.length > 0) await local.importMany(nuevos);
      if (cursor !== null) datos.cursor = cursor;
      if (primeraBajada) {
        const locales = await local.list();
        datos.pendientes = unirIds(datos.pendientes, faltanEnNube(locales, new Set(nuevos.map((i) => i.id))));
      }
      guardar();

      await subirPendientes(r);
      poner({ tipo: "sincronizado", pendientes: 0 });
    } catch (e) {
      guardar();
      fallo(e);
    }
  }

  /** Marca intentos como pendientes de subir (si este navegador está ligado a una cuenta) y los empuja si hay sesión. */
  function marcarPendientes(ids: readonly string[]): void {
    if (datos.uid === null || ids.length === 0) return;
    datos.pendientes = unirIds(datos.pendientes, ids);
    guardar();
    if (remoto && uid === datos.uid) {
      const r = remoto;
      void enCola(async () => {
        try {
          poner({ tipo: "sincronizando" });
          await subirPendientes(r);
          poner({ tipo: "sincronizado", pendientes: 0 });
        } catch (e) {
          fallo(e);
        }
      });
    } else {
      poner(sinConexion() ? { tipo: "sin-conexion", pendientes: datos.pendientes.length } : estado);
    }
  }

  const almacen: RunStore = {
    list: () => local.list(),
    async add(intento: Intento) {
      await local.add(intento);
      marcarPendientes([intento.id]);
    },
    async clear() {
      // Vacía este dispositivo y olvida lo ya descargado: si hay sesión, la próxima sincronización lo recupera de la nube.
      await local.clear();
      if (datos.uid !== null) {
        datos.cursor = null;
        datos.pendientes = [];
        guardar();
      }
    },
    async importMany(intentos: Intento[]) {
      const nuevos = await local.importMany(intentos);
      if (nuevos > 0) marcarPendientes(intentos.map((i) => i.id));
      return nuevos;
    },
    subscribe: (fn) => local.subscribe(fn),
  };

  const controlador: ControladorSync = {
    estado: () => estado,
    suscribirEstado(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
    conectar(r, id) {
      remoto = r;
      uid = id;
      return enCola(sincronizarAhora);
    },
    desconectar() {
      remoto = null;
      uid = null;
      poner({ tipo: "local" });
    },
    sincronizar: () => enCola(sincronizarAhora),
    resolverCuentaDistinta(modo) {
      return enCola(async () => {
        if (modo === "limpio") await local.clear();
        // "unir": el navegador pasa a ser de la cuenta actual y todo lo local se compara con su nube y se sube.
        datos = datosVacios();
        guardar();
        await sincronizarAhora();
      });
    },
    borrarTodoEnNube() {
      return enCola(async () => {
        if (!remoto || !uid) throw new Error("Inicia sesión para borrar también en la nube.");
        try {
          poner({ tipo: "sincronizando" });
          const ep = await remoto.borrarTodo();
          await local.clear();
          datos = { uid, cursor: null, epochVisto: ep, pendientes: [] };
          guardar();
          poner({ tipo: "sincronizado", pendientes: 0 });
        } catch (e) {
          fallo(e);
          throw e;
        }
      });
    },
  };

  return { almacen, controlador };
}
