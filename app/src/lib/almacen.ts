// Almacén de intentos. Todo acceso pasa por la interfaz `RunStore`:
// - `crearAlmacenMemoria()` para los tests.
// - `crearAlmacenIndexedDB()` en el navegador (base `txispatype`, almacén `intentos`).
// Un intento con teclas y pares ocupa unos 3-5 KB; con localStorage (~5 MB) no
// llegaría ni a un año de uso, de ahí IndexedDB. Ver especificación §2.

import type { Intento } from "../types";

export const SCHEMA = 1;

export interface RunStore {
  /** Todos los intentos, del más antiguo al más reciente. */
  list(): Promise<Intento[]>;
  add(intento: Intento): Promise<void>;
  clear(): Promise<void>;
  /** Fusiona por `id`: no duplica. Devuelve cuántos intentos eran nuevos. */
  importMany(intentos: Intento[]): Promise<number>;
  /** Avisa tras cada cambio. Devuelve la función para dejar de escuchar. */
  subscribe(fn: () => void): () => void;
}

function ordenar(intentos: Intento[]): Intento[] {
  return [...intentos].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function crearAlmacenMemoria(inicial: Intento[] = []): RunStore {
  const mapa = new Map<string, Intento>(inicial.map((i) => [i.id, i]));
  const oyentes = new Set<() => void>();
  const avisa = () => oyentes.forEach((fn) => fn());
  return {
    async list() {
      return ordenar([...mapa.values()]);
    },
    async add(intento) {
      mapa.set(intento.id, intento);
      avisa();
    },
    async clear() {
      mapa.clear();
      avisa();
    },
    async importMany(intentos) {
      let nuevos = 0;
      for (const i of intentos) {
        if (!mapa.has(i.id)) {
          mapa.set(i.id, i);
          nuevos++;
        }
      }
      if (nuevos > 0) avisa();
      return nuevos;
    },
    subscribe(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
  };
}

const BD = "txispatype";
const ALMACEN = "intentos";

function promesa<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function terminada(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BD, SCHEMA);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ALMACEN)) {
        const store = db.createObjectStore(ALMACEN, { keyPath: "id" });
        store.createIndex("localDate", "localDate");
        store.createIndex("date", "date");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function crearAlmacenIndexedDB(): RunStore {
  const oyentes = new Set<() => void>();
  const avisa = () => oyentes.forEach((fn) => fn());
  let abierta: Promise<IDBDatabase> | null = null;
  const bd = () => (abierta ??= abrir());

  // Pide almacenamiento persistente para que el navegador no lo borre solo.
  void navigator.storage?.persist?.().catch(() => false);

  return {
    async list() {
      const db = await bd();
      const todos = await promesa(db.transaction(ALMACEN, "readonly").objectStore(ALMACEN).getAll());
      return ordenar(todos as Intento[]);
    },
    async add(intento) {
      const db = await bd();
      const tx = db.transaction(ALMACEN, "readwrite");
      tx.objectStore(ALMACEN).put(intento);
      await terminada(tx);
      avisa();
    },
    async clear() {
      const db = await bd();
      const tx = db.transaction(ALMACEN, "readwrite");
      tx.objectStore(ALMACEN).clear();
      await terminada(tx);
      avisa();
    },
    async importMany(intentos) {
      const db = await bd();
      const tx = db.transaction(ALMACEN, "readwrite");
      const store = tx.objectStore(ALMACEN);
      const existentes = new Set((await promesa(store.getAllKeys())) as string[]);
      let nuevos = 0;
      for (const i of intentos) {
        if (!existentes.has(i.id)) {
          store.put(i);
          existentes.add(i.id);
          nuevos++;
        }
      }
      await terminada(tx);
      if (nuevos > 0) avisa();
      return nuevos;
    },
    subscribe(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
  };
}
