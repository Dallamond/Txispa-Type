import { useEffect, useState } from "react";
import { diaLocal } from "../lib/estadisticas";

/** Día de hoy ("YYYY-MM-DD", hora de Madrid). Se actualiza solo al cambiar de día,
 * para que Hoy y Estadísticas no se queden con el día de ayer si la pestaña sigue abierta. */
export function useHoy(): string {
  const [hoy, setHoy] = useState(() => diaLocal(new Date()));
  useEffect(() => {
    const id = setInterval(() => setHoy(diaLocal(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);
  return hoy;
}
