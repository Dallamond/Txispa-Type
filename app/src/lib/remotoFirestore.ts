// Adaptador de Firestore para la sincronización. Es la ÚNICA pieza (con `firebase.ts`) que habla con
// `firebase/firestore`; se importa de forma diferida desde `hooks/useSincronizacion.ts`.
//
// Modelo (docs/PLAN_INTEGRACION_FIREBASE.md §3):
//   users/{uid}                  { schema, resetEpoch }
//   users/{uid}/intentos/{id}    el intento tal cual + syncedAt (hora del servidor)
//   users/{uid}/ajustes/actual   subconjunto sincronizable de Ajustes + updatedAt (servidor)
//   users/{uid}/contadores/global  { calentamientoPuls }  (solo increment)
//   users/{uid}/dias/{fecha}     { extraSeg }              (solo increment)
// Los intentos se crean una vez y no se modifican: las reglas prohíben el `update`.
// Siempre `set` del documento entero: las claves de `teclas`/`pares` son caracteres arbitrarios ('.', 'ñ', '␣'),
// que con `update` y rutas con puntos se romperían.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { AjustesSincronizables, Intento } from "../types";
import { esIntentoValido } from "./exportar";
import { LOTE, paraNube, subirUnoAUno, trocear, type AjustesRemotos, type RemotoCuenta } from "./sincronizacion";

const SCHEMA_NUBE = 1;

const esPermisoDenegado = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "permission-denied";

export function crearRemotoFirestore(db: Firestore, uid: string): RemotoCuenta {
  const intentos = collection(db, "users", uid, "intentos");
  const perfil = doc(db, "users", uid);
  const refAjustes = doc(db, "users", uid, "ajustes", "actual");
  const refGlobal = doc(db, "users", uid, "contadores", "global");
  const refDia = (dia: string) => doc(db, "users", uid, "dias", dia);
  const numero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  const leerAjustesDe = (d: { exists(): boolean; data(): Record<string, unknown> | undefined }): AjustesRemotos | null => {
    if (!d.exists()) return null;
    const { updatedAt, ...valores } = d.data() ?? {};
    return { valores, updatedAt: updatedAt instanceof Timestamp ? updatedAt.toMillis() : 0 };
  };

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
          // Las reglas rechazan sobrescribir un intento que ya existe, pero también uno con forma inválida: se repite
          // uno a uno y solo lo que de verdad está en la nube cuenta como subido.
          await subirUnoAUno(
            lote,
            (i) => setDoc(doc(intentos, i.id), { ...paraNube(i), syncedAt: serverTimestamp() }),
            async (i) => (await getDoc(doc(intentos, i.id))).exists(),
            esPermisoDenegado,
          );
        }
      }
    },

    epoch,

    async leerAjustes() {
      return leerAjustesDe(await getDoc(refAjustes));
    },

    async escribirAjustes(valores: AjustesSincronizables) {
      // Documento entero (sin merge): las claves son fijas y la última escritura gana.
      await setDoc(refAjustes, { ...valores, updatedAt: serverTimestamp() });
      return leerAjustesDe(await getDoc(refAjustes))?.updatedAt ?? Date.now();
    },

    escucharAjustes(aviso) {
      return onSnapshot(
        refAjustes,
        (snap) => {
          if (snap.metadata.hasPendingWrites) return; // eco de una escritura propia aún sin confirmar
          const a = leerAjustesDe(snap);
          if (a) aviso(a);
        },
        () => undefined, // permiso o red: la sincronización normal reintenta
      );
    },

    async leerContadores(dia) {
      const [g, d] = await Promise.all([getDoc(refGlobal), getDoc(refDia(dia))]);
      return { calentamientoPuls: numero(g.data()?.calentamientoPuls), extraSeg: numero(d.data()?.extraSeg) };
    },

    async sumarContadores({ calentamientoPuls, extraSeg }) {
      // `merge` + `increment`: crea el documento si no existe y suma si existe. Campos fijos, sin rutas con puntos.
      if (calentamientoPuls > 0) await setDoc(refGlobal, { calentamientoPuls: increment(calentamientoPuls) }, { merge: true });
      for (const [dia, s] of Object.entries(extraSeg)) {
        if (s > 0) await setDoc(refDia(dia), { extraSeg: increment(s) }, { merge: true });
      }
    },

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
