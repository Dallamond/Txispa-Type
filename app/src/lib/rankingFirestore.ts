// Almacén real del ranking público sobre Firestore (docs/RANKING.md). Esta parte NO importa el SDK:
// habla con un `BackendRanking` mínimo e inyectable (en los tests, uno simulado). El SDK vive en
// `rankingFirestoreSdk.ts` y solo se carga (import() dinámico) cuando se usa el ranking con la nube configurada.
//
// Modelo:
//   publico/{uid}        { alias, mejorWpm, accMejor, tests, actualizadoEn }
//   alias/{aliasLower}   { uid }      (reserva del alias: unicidad sin distinguir mayúsculas)
// Publicar y retirar son lotes atómicos (writeBatch): perfil y reserva se escriben o se borran juntos.

import { aliasClave, validarAlias, type FilaRanking, type RankingStore } from "./ranking";
import { cargarFirebase, nubeConfigurada } from "./firebase";

/** Operación de un lote atómico. */
export type OpLote =
  | { tipo: "poner"; coleccion: "publico"; id: string; datos: FilaRanking }
  | { tipo: "poner"; coleccion: "alias"; id: string; datos: { uid: string } }
  | { tipo: "borrar"; coleccion: "publico" | "alias"; id: string };

/** Lo mínimo que RankingFirestore necesita del almacén remoto. */
export interface BackendRanking {
  /** Perfil público de un uid (null si no existe). */
  leerPerfil(uid: string): Promise<FilaRanking | null>;
  /** Dueño de una reserva de alias (null si está libre). */
  leerReserva(clave: string): Promise<string | null>;
  /** Aplica todas las operaciones o ninguna. `actualizadoEn` lo pone el servidor. */
  lote(ops: OpLote[]): Promise<void>;
  /** Las `n` mejores filas por mejorWpm descendente. */
  listar(n: number): Promise<FilaRanking[]>;
  /** Cuántos perfiles tienen un mejorWpm estrictamente mayor. */
  contarMejores(mejorWpm: number): Promise<number>;
}

/** Texto en español para un error del SDK o de red. */
export function mensajeErrorRanking(e: unknown): string {
  const code = typeof e === "object" && e !== null ? (e as { code?: string }).code : undefined;
  switch (code) {
    case "permission-denied":
      return "El ranking rechazó la operación (permisos). Comprueba que has iniciado sesión y que el alias es válido y no está en uso.";
    case "unavailable":
    case "deadline-exceeded":
      return "No hay conexión con el ranking ahora mismo. Inténtalo de nuevo en un rato.";
    case "resource-exhausted":
      return "El ranking ha alcanzado su cuota diaria. Vuelve a probar mañana.";
    case "unauthenticated":
      return "Inicia sesión para usar el ranking.";
    default:
      return e instanceof Error && e.message ? e.message : "No se pudo completar la operación con el ranking.";
  }
}

const SIN_SESION = "Para entrar en el ranking necesitas iniciar sesión.";

/** Ranking sobre Firestore. `uid` es null si no hay sesión: ver el ranking es libre, participar no. */
export class RankingFirestore implements RankingStore {
  private readonly cargarBackend: () => Promise<BackendRanking>;
  private readonly uid: string | null;

  constructor(cargarBackend: () => Promise<BackendRanking>, uid: string | null) {
    this.cargarBackend = cargarBackend;
    this.uid = uid;
  }

  private async operar<T>(f: (b: BackendRanking) => Promise<T>): Promise<T> {
    try {
      return await f(await this.cargarBackend());
    } catch (e) {
      throw new Error(mensajeErrorRanking(e));
    }
  }

  listar(n: number): Promise<FilaRanking[]> {
    return this.operar((b) => b.listar(Math.max(0, n)));
  }

  async publicar(perfil: FilaRanking): Promise<void> {
    const uid = this.uid;
    if (!uid) throw new Error(SIN_SESION);
    const v = validarAlias(perfil.alias);
    if (!v.valido) throw new Error(v.motivo ?? "Alias no válido.");
    const clave = aliasClave(perfil.alias);
    await this.operar(async (b) => {
      const [actual, dueno] = await Promise.all([b.leerPerfil(uid), b.leerReserva(clave)]);
      if (dueno !== null && dueno !== uid) throw new Error("Ese alias ya está en uso.");
      const claveAntigua = actual ? aliasClave(actual.alias) : null;
      const ops: OpLote[] = [{ tipo: "poner", coleccion: "publico", id: uid, datos: { ...perfil } }];
      // La reserva solo se crea si no es ya nuestra (las reglas no permiten reescribirla: `update` cerrado).
      if (dueno === null) ops.push({ tipo: "poner", coleccion: "alias", id: clave, datos: { uid } });
      if (claveAntigua !== null && claveAntigua !== clave) ops.push({ tipo: "borrar", coleccion: "alias", id: claveAntigua });
      await b.lote(ops);
    });
  }

  async retirar(): Promise<void> {
    const uid = this.uid;
    if (!uid) throw new Error(SIN_SESION);
    await this.operar(async (b) => {
      const actual = await b.leerPerfil(uid);
      if (!actual) return;
      await b.lote([
        { tipo: "borrar", coleccion: "publico", id: uid },
        { tipo: "borrar", coleccion: "alias", id: aliasClave(actual.alias) },
      ]);
    });
  }

  aliasLibre(alias: string): Promise<boolean> {
    return this.operar(async (b) => {
      const dueno = await b.leerReserva(aliasClave(alias));
      return dueno === null || dueno === this.uid;
    });
  }

  async miPuesto(): Promise<number | null> {
    const uid = this.uid;
    if (!uid) return null;
    return this.operar(async (b) => {
      const mio = await b.leerPerfil(uid);
      if (!mio) return null;
      return (await b.contarMejores(mio.mejorWpm)) + 1;
    });
  }
}

/** Backend real: carga el SDK solo ahora y se queda con una única instancia. */
function backendDiferido(): () => Promise<BackendRanking> {
  let p: Promise<BackendRanking> | null = null;
  return () => {
    p ??= (async () => {
      if (!nubeConfigurada()) throw new Error("El ranking necesita la nube y esta versión no la tiene configurada.");
      const [{ db }, { crearBackendFirestore }] = await Promise.all([cargarFirebase(), import("./rankingFirestoreSdk")]);
      return crearBackendFirestore(db);
    })();
    p.catch(() => {
      p = null; // permite reintentar tras un fallo de red al cargar el SDK
    });
    return p;
  };
}

/** Crea el almacén real para el usuario actual (uid null = sin sesión: solo lectura). */
export function crearRankingNube(uid: string | null): RankingStore {
  return new RankingFirestore(backendDiferido(), uid);
}
