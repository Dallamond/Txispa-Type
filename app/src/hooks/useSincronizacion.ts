import { useEffect, useSyncExternalStore } from "react";
import type { ControladorSync } from "../lib/almacenSincronizado";
import type { EstadoSync } from "../lib/sincronizacion";
import { almacenLocal } from "../lib/ajustes";
import { contadoresApp } from "../lib/contadores";
import { diaLocal } from "../lib/estadisticas";
import { cargarFirebase } from "../lib/firebase";
import { sincronizadorAjustesApp } from "../lib/sincronizadorAjustes";

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
        if (!vivo) return;
        const remoto = crearRemotoFirestore(db, uid);
        await controlador.conectar(remoto, uid);
        // Ajustes y contadores van aparte de los intentos: un fallo en ellos no debe romper la sincronización principal.
        if (!vivo) return;
        await Promise.allSettled([
          sincronizadorAjustesApp(almacenLocal()).conectar(remoto, uid),
          contadoresApp(almacenLocal()).conectar(remoto, uid, diaLocal(new Date())),
        ]);
      } catch {
        // Sin red al cargar el SDK: se reintenta en el siguiente evento "online".
      }
    })();
    const resincronizar = () => {
      if (document.visibilityState === "visible") {
        void controlador.sincronizar();
        void contadoresApp(almacenLocal()).sincronizar(diaLocal(new Date())).catch(() => undefined);
      }
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
