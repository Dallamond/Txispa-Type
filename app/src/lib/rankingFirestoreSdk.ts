// Adaptador del ranking al SDK de Firestore. Única pieza del ranking que importa `firebase/firestore`;
// se carga con import() dinámico desde `rankingFirestore.ts`. NO probado contra Firebase real.
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { FilaRanking } from "./ranking";
import type { BackendRanking } from "./rankingFirestore";

function aFila(d: Record<string, unknown> | undefined): FilaRanking | null {
  if (!d) return null;
  const { alias, mejorWpm, accMejor, tests } = d;
  if (typeof alias !== "string" || typeof mejorWpm !== "number" || typeof accMejor !== "number" || typeof tests !== "number") return null;
  return { alias, mejorWpm, accMejor, tests };
}

export function crearBackendFirestore(db: Firestore): BackendRanking {
  const publico = collection(db, "publico");
  return {
    async leerPerfil(uid) {
      return aFila((await getDoc(doc(publico, uid))).data());
    },
    async leerReserva(clave) {
      const uid = (await getDoc(doc(db, "alias", clave))).data()?.uid;
      return typeof uid === "string" ? uid : null;
    },
    async lote(ops) {
      const batch = writeBatch(db);
      for (const op of ops) {
        const ref = doc(db, op.coleccion, op.id);
        if (op.tipo === "borrar") batch.delete(ref);
        else if (op.coleccion === "publico") batch.set(ref, { ...op.datos, actualizadoEn: serverTimestamp() });
        else batch.set(ref, op.datos);
      }
      await batch.commit();
    },
    async listar(n) {
      const snap = await getDocs(query(publico, orderBy("mejorWpm", "desc"), limit(n)));
      return snap.docs.map((d) => aFila(d.data())).filter((f): f is FilaRanking => f !== null);
    },
    async contarMejores(mejorWpm) {
      const snap = await getCountFromServer(query(publico, where("mejorWpm", ">", mejorWpm)));
      return snap.data().count;
    },
  };
}
