import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Intento } from "../types";
import { almacenLocal } from "../lib/ajustes";
import { leerPulsacionesCalentamiento, sumarPulsacionesCalentamiento } from "../lib/contador";
import { leerTiempoExtra, sumarTiempoExtra } from "../lib/contador";
import { diaLocal, pulsacionesTotales, segundosDelDia } from "../lib/estadisticas";
import { useHoy } from "./useHoy";

// Contador global de pulsaciones, siempre visible arriba. Suma tres cosas:
//  - los intentos guardados (tests y entrenos),
//  - los calentamientos terminados (contador aparte, no se guardan como intento),
//  - la sesión en curso, que sube pulsación a pulsación.
// La sesión en curso se pone a 0 cuando su intento aparece en el almacén, para no contarla dos veces.
// La sesión en curso se pone a 0 cuando su intento aparece en el almacén, para no contarla dos veces.

interface ContadorApi {
  /** Pulsaciones de la sesión en curso (la llama Tecleo en cada tecla). */
  reportar: (n: number) => void;
  /** Segundos transcurridos de la sesión en curso; solo si se va a guardar (los calentamientos no cuentan como tiempo de práctica). */
  reportarTiempo: (segundos: number) => void;
  /** Un calentamiento termina: sus pulsaciones pasan al contador de calentamientos. */
  confirmar: (n: number) => void;
  /** La sesión se abandona sin guardarse: deja de contar y guarda esos segundos como tiempo del día (solo nulos y calentamientos pasan 0). */
  descartar: (segundos?: number) => void;
}

const SinContador: ContadorApi = {
  reportar: () => undefined,
  reportarTiempo: () => undefined,
  confirmar: () => undefined,
  descartar: () => undefined,
};
const Contexto = createContext<ContadorApi>(SinContador);

export function useContadorTecleo(): ContadorApi {
  return useContext(Contexto);
}

export function useTotalPulsaciones(intentos: readonly Intento[]) {
  const [vivas, setVivas] = useState(0);
  const [vivosSeg, setVivosSeg] = useState(0);
  const [extraSeg, setExtraSeg] = useState(0);
  const hoy = useHoy();
  const [calentamiento, setCalentamiento] = useState(() => leerPulsacionesCalentamiento(almacenLocal()));
  const guardadas = useMemo(() => pulsacionesTotales([...intentos]), [intentos]);

  // El intento recién guardado ya está en `guardadas`: la sesión viva deja de sumar.
  useEffect(() => {
    setVivas(0);
    setVivosSeg(0);
  }, [intentos]);

  const segundosGuardados = useMemo(() => segundosDelDia([...intentos], hoy), [intentos, hoy]);
  const segundosExtra = useMemo(() => leerTiempoExtra(almacenLocal(), hoy), [hoy]);

  const api = useMemo<ContadorApi>(
    () => ({
      reportar: (n) => setVivas(n),
      // Solo segundos enteros: así el estado no cambia (ni se repinta la app) 10 veces por segundo.
      reportarTiempo: (s) => setVivosSeg(Math.floor(s)),
      confirmar: (n) => {
        setCalentamiento(sumarPulsacionesCalentamiento(almacenLocal(), n));
        setVivas(0);
        setVivosSeg(0);
      },
      descartar: (segundos = 0) => {
        // Test abandonado: lo tecleado no se guarda, pero el tiempo del día sí. Solo la parte entera.
        if (segundos >= 1) {
          setExtraSeg(sumarTiempoExtra(almacenLocal(), diaLocal(new Date()), Math.floor(segundos)));
        }
        setVivas(0);
        setVivosSeg(0);
      },
    }),
    []
  );

  // Lo leído del almacén vale si el acumulado vivo no es mayor; si lo es (se acaba de
  // sumar esta sesión), gana el vivo.
  const totalExtra = Math.max(segundosExtra, extraSeg);

  return { total: guardadas + calentamiento + vivas, segundosHoy: segundosGuardados + totalExtra + vivosSeg, api };
}

export function ProveedorContador({ api, children }: { api: ContadorApi; children: ReactNode }) {
  return <Contexto.Provider value={api}>{children}</Contexto.Provider>;
}

