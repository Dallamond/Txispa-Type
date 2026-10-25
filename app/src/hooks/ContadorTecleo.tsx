import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Intento } from "../types";
import { almacenLocal } from "../lib/ajustes";
import { leerPulsacionesCalentamiento, sumarPulsacionesCalentamiento } from "../lib/contador";
import { pulsacionesTotales } from "../lib/estadisticas";

// Contador global de pulsaciones, siempre visible arriba. Suma tres cosas:
//  - los intentos guardados (tests y entrenos),
//  - los calentamientos terminados (contador aparte, no se guardan como intento),
//  - la sesión en curso, que sube pulsación a pulsación.
// La sesión en curso se pone a 0 cuando su intento aparece en el almacén, para no contarla dos veces.

interface ContadorApi {
  /** Pulsaciones de la sesión en curso (la llama Tecleo en cada tecla). */
  reportar: (n: number) => void;
  /** Un calentamiento termina: sus pulsaciones pasan al contador de calentamientos. */
  confirmar: (n: number) => void;
  /** La sesión se abandona sin guardarse: deja de contar. */
  descartar: () => void;
}

const SinContador: ContadorApi = { reportar: () => undefined, confirmar: () => undefined, descartar: () => undefined };
const Contexto = createContext<ContadorApi>(SinContador);

export function useContadorTecleo(): ContadorApi {
  return useContext(Contexto);
}

export function useTotalPulsaciones(intentos: readonly Intento[]) {
  const [vivas, setVivas] = useState(0);
  const [calentamiento, setCalentamiento] = useState(() => leerPulsacionesCalentamiento(almacenLocal()));
  const guardadas = useMemo(() => pulsacionesTotales([...intentos]), [intentos]);

  // El intento recién guardado ya está en `guardadas`: la sesión viva deja de sumar.
  useEffect(() => setVivas(0), [intentos]);

  const api = useMemo<ContadorApi>(
    () => ({
      reportar: (n) => setVivas(n),
      confirmar: (n) => {
        setCalentamiento(sumarPulsacionesCalentamiento(almacenLocal(), n));
        setVivas(0);
      },
      descartar: () => setVivas(0),
    }),
    []
  );

  return { total: guardadas + calentamiento + vivas, api };
}

export function ProveedorContador({ api, children }: { api: ContadorApi; children: ReactNode }) {
  return <Contexto.Provider value={api}>{children}</Contexto.Provider>;
}

