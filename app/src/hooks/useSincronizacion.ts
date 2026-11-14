import { useEffect, useSyncExternalStore } from "react";
import type { ControladorSync } from "../lib/almacenSincronizado";
import type { EstadoSync } from "../lib/sincronizacion";
import { cargarFirebase } from "../lib/firebase";

/** Conecta el controlador con la nube de la cuenta que ha iniciado sesión y lo mantiene al día:
 * al abrir, al volver la red y al volver a la pestaña. Sin sesión, la app queda en local. */
export function useSincronizacion(controlador: ControladorSync, uid: string | null): EstadoSync {
  useEffect(() => {
    if (uid === null) {
      controlador.desconectar();
      return;
    }
    let vivo = true;
    void (async () => {
      try {
        const { db } = await cargarFirebase();
        const { crearRemotoFirestore } = await import("../lib/remotoFirestore");
        if (vivo) await controlador.conectar(crearRemotoFirestore(db, uid), uid);
      } catch {
        // Sin red al cargar el SDK: se reintenta en el siguiente evento "online".
      }
    })();
    const resincronizar = () => {
      if (document.visibilityState === "visible") void controlador.sincronizar();
    };
    window.addEventListener("online", resincronizar);
    document.addEventListener("visibilitychange", resincronizar);
    return () => {
      vivo = false;
      window.removeEventListener("online", resincronizar);
      document.removeEventListener("visibilitychange", resincronizar);
    };
  }, [controlador, uid]);

  return useSyncExternalStore(
    (fn) => controlador.suscribirEstado(fn),
    () => controlador.estado()
  );
}
