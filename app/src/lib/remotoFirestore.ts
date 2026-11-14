// Adaptador de Firestore para la sincronización. Es la ÚNICA pieza (con `firebase.ts`) que habla con
// `firebase/firestore`; se importa de forma diferida desde `hooks/useSincronizacion.ts`.
//
// Modelo (docs/PLAN_INTEGRACION_FIREBASE.md §3):
//   users/{uid}                  { schema, resetEpoch }
//   users/{uid}/intentos/{id}    el intento tal cual + syncedAt (hora del servidor)
// Los intentos se crean una vez y no se modifican: las reglas prohíben el `update`.
// Siempre `set` del documento entero: las claves de `teclas`/`pares` son caracteres arbitrarios ('.', 'ñ', '␣'),
// que con `update` y rutas con puntos se romperían.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { Intento } from "../types";
import { esIntentoValido } from "./exportar";
import { LOTE, paraNube, trocear, type Remoto } from "./sincronizacion";

const SCHEMA_NUBE = 1;

const esPermisoDenegado = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "permission-denied";

export function crearRemotoFirestore(db: Firestore, uid: string): Remoto {
  const intentos = collection(db, "users", uid, "intentos");
  const perfil = doc(db, "users", uid);

  async function epoch(): Promise<number> {
    const v = (await getDoc(perfil)).data()?.resetEpoch;
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  }

  return {
    async bajar(cursor) {
      // `>=` y no `>`: el cursor está en milisegundos y Firestore guarda más precisión; lo repetido se descarta por id.
      const q = cursor === null ? query(intentos, orderBy("syncedAt")) : query(intentos, where("syncedAt", ">=", Timestamp.fromMillis(cursor)), orderBy("syncedAt"));
      const snap = await getDocs(q);
      const lista: Intento[] = [];
      let mayor: number | null = cursor;
      for (const d of snap.docs) {
        const { syncedAt, deviceId: _deviceId, ...resto } = d.data() as Record<string, unknown>;
        if (syncedAt instanceof Timestamp) mayor = Math.max(mayor ?? 0, syncedAt.toMillis());
        if (esIntentoValido(resto)) lista.push(resto);
      }
      return { intentos: lista, cursor: mayor };
    },

    async subir(lista) {
      for (const lote of trocear(lista, LOTE)) {
        try {
          const batch = writeBatch(db);
          for (const i of lote) batch.set(doc(intentos, i.id), { ...paraNube(i), syncedAt: serverTimestamp() });
          await batch.commit();
        } catch (e) {
          if (!esPermisoDenegado(e)) throw e;
          // Algún documento ya existía (una subida anterior se perdió antes de confirmarse) y las reglas rechazan
          // sobrescribirlo: se repite uno a uno y lo que ya está en la nube cuenta como subido.
          for (const i of lote) {
            try {
              await setDoc(doc(intentos, i.id), { ...paraNube(i), syncedAt: serverTimestamp() });
            } catch (e2) {
              if (!esPermisoDenegado(e2)) throw e2;
            }
          }
        }
      }
    },

    epoch,

    async borrarTodo() {
      const snap = await getDocs(intentos);
      for (const lote of trocear(snap.docs, LOTE)) {
        const batch = writeBatch(db);
        for (const d of lote) batch.delete(d.ref);
        await batch.commit();
      }
      const nuevo = (await epoch()) + 1;
      await setDoc(perfil, { schema: SCHEMA_NUBE, resetEpoch: nuevo });
      return nuevo;
    },
  };
}
