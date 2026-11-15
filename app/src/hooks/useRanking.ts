import { useCallback, useEffect, useState } from "react";
import { TOP_RANKING, type FilaRanking, type RankingStore } from "../lib/ranking";

/** A partir de este tiempo sin respuesta se avisa de que va lento. */
export const AVISO_LENTO_MS = 2500;
/** Tope de espera; pasado esto se muestra el error con botón de reintento. */
export const TOPE_MS = 15000;
/** Vigencia de la caché de la lista. */
export const CACHE_MS = 5 * 60 * 1000;

interface Entrada {
  t: number;
  filas: FilaRanking[];
  puesto: number | null;
}
const cache = new WeakMap<RankingStore, Entrada>();

export type EstadoRanking = "cargando" | "ok" | "error";

export interface DatosRanking {
  estado: EstadoRanking;
  filas: FilaRanking[];
  puesto: number | null;
  /** True si la carga lleva más de AVISO_LENTO_MS. */
  lento: boolean;
  error: string | null;
  /** Vuelve a pedir los datos ignorando la caché (tras publicar/retirar o al reintentar). */
  recargar: () => void;
}

function conTope<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((ok, ko) => {
    const id = setTimeout(() => ko(new Error("El ranking tarda demasiado en responder.")), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        ok(v);
      },
      (e) => {
        clearTimeout(id);
        ko(e);
      },
    );
  });
}

/** Carga el ranking con aviso de lentitud a 2,5 s, tope de 15 s y caché de 5 min por almacén. */
export function useRanking(store: RankingStore): DatosRanking {
  const [version, setVersion] = useState(0);
  const [datos, setDatos] = useState<{ estado: EstadoRanking; filas: FilaRanking[]; puesto: number | null; error: string | null }>(() => {
    const c = cache.get(store);
    return c && Date.now() - c.t < CACHE_MS
      ? { estado: "ok", filas: c.filas, puesto: c.puesto, error: null }
      : { estado: "cargando", filas: [], puesto: null, error: null };
  });
  const [lento, setLento] = useState(false);

  useEffect(() => {
    const c = cache.get(store);
    if (version === 0 && c && Date.now() - c.t < CACHE_MS) {
      setDatos({ estado: "ok", filas: c.filas, puesto: c.puesto, error: null });
      return;
    }
    let vivo = true;
    setDatos((d) => ({ ...d, estado: "cargando", error: null }));
    setLento(false);
    const aviso = setTimeout(() => vivo && setLento(true), AVISO_LENTO_MS);
    conTope(Promise.all([store.listar(TOP_RANKING), store.miPuesto()]), TOPE_MS).then(
      ([filas, puesto]) => {
        clearTimeout(aviso);
        if (!vivo) return;
        cache.set(store, { t: Date.now(), filas, puesto });
        setLento(false);
        setDatos({ estado: "ok", filas, puesto, error: null });
      },
      (e: unknown) => {
        clearTimeout(aviso);
        if (!vivo) return;
        setLento(false);
        setDatos((d) => ({ ...d, estado: "error", error: e instanceof Error ? e.message : "No se pudo cargar el ranking." }));
      },
    );
    return () => {
      vivo = false;
      clearTimeout(aviso);
    };
  }, [store, version]);

  const recargar = useCallback(() => {
    cache.delete(store);
    setVersion((v) => v + 1);
  }, [store]);

  return { ...datos, lento, recargar };
}
