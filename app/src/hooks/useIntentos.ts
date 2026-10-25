import { useEffect, useState } from "react";
import type { Intento } from "../types";
import type { RunStore } from "../lib/almacen";

/** Lista de intentos del almacén, que se actualiza sola tras cada cambio. */
export function useIntentos(almacen: RunStore) {
  const [intentos, setIntentos] = useState<Intento[]>([]);
  const [cargados, setCargados] = useState(false);

  useEffect(() => {
    let vivo = true;
    const cargar = () =>
      almacen
        .list()
        .then((lista) => {
          if (!vivo) return;
          setIntentos(lista);
          setCargados(true);
        })
        .catch(() => {
          if (vivo) setCargados(true);
        });
    void cargar();
    const baja = almacen.subscribe(() => void cargar());
    return () => {
      vivo = false;
      baja();
    };
  }, [almacen]);

  return { intentos, cargados };
}
