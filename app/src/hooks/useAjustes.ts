import { useCallback, useEffect, useState } from "react";
import type { Ajustes } from "../types";
import { aplicarSincronizables, almacenLocal, cargarAjustes, extraerSincronizables, guardarAjustes } from "../lib/ajustes";
import { sincronizadorAjustesApp } from "../lib/sincronizadorAjustes";

/** Ajustes persistentes. Aplica tema y zoom al documento. Los sincronizables se comparten con la cuenta (si hay sesión). */
export function useAjustes() {
  const [ajustes, setAjustes] = useState<Ajustes>(() => cargarAjustes(almacenLocal()));

  useEffect(() => {
    document.documentElement.dataset.theme = ajustes.tema;
    document.documentElement.style.fontSize = `${16 * ajustes.zoom}px`;
  }, [ajustes.tema, ajustes.zoom]);

  // Cambios llegados de otro dispositivo: ya están en el almacén; aquí solo se reflejan en pantalla (sin volver a subirlos).
  useEffect(
    () =>
      sincronizadorAjustesApp(almacenLocal()).suscribir((nuevo) => {
        setAjustes((prev) => aplicarSincronizables(prev, extraerSincronizables(nuevo)));
      }),
    []
  );

  const cambiar = useCallback((parcial: Partial<Ajustes>) => {
    setAjustes((prev) => {
      const sig = { ...prev, ...parcial };
      guardarAjustes(almacenLocal(), sig);
      return sig;
    });
    sincronizadorAjustesApp(almacenLocal()).cambioLocal(parcial);
  }, []);

  return [ajustes, cambiar] as const;
}
