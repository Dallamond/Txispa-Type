import { useCallback, useEffect, useState } from "react";
import type { Ajustes } from "../types";
import { almacenLocal, cargarAjustes, guardarAjustes } from "../lib/ajustes";

/** Ajustes persistentes. Aplica tema y zoom al documento. */
export function useAjustes() {
  const [ajustes, setAjustes] = useState<Ajustes>(() => cargarAjustes(almacenLocal()));

  useEffect(() => {
    document.documentElement.dataset.theme = ajustes.tema;
    document.documentElement.style.fontSize = `${16 * ajustes.zoom}px`;
  }, [ajustes.tema, ajustes.zoom]);

  const cambiar = useCallback((parcial: Partial<Ajustes>) => {
    setAjustes((prev) => {
      const sig = { ...prev, ...parcial };
      guardarAjustes(almacenLocal(), sig);
      return sig;
    });
  }, []);

  return [ajustes, cambiar] as const;
}
