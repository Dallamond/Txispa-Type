// Textos del estado de sincronización. Lógica pura, probada en `estadoSync.test.ts`.

import type { EstadoSync } from "./sincronizacion";

const plural = (n: number) => `${n} ${n === 1 ? "intento pendiente" : "intentos pendientes"}`;

/** Frase completa para el panel de cuenta. */
export function textoEstadoSync(e: EstadoSync): string {
  switch (e.tipo) {
    case "local":
      return "Solo en este navegador.";
    case "sincronizando":
      return "Sincronizando…";
    case "sincronizado":
      return "Sincronizado: tus intentos están al día en la nube.";
    case "sin-conexion":
      return e.pendientes > 0 ? `Sin conexión (${plural(e.pendientes)}; se subirán al volver).` : "Sin conexión.";
    case "error":
      return `Error de sincronización: ${e.mensaje}${e.pendientes > 0 ? ` (${plural(e.pendientes)})` : ""}.`;
    case "cuenta-distinta":
      return "Hay datos de otra cuenta en este navegador: elige qué hacer con ellos.";
  }
}

/** Etiqueta corta para la cabecera, o null si no hay nada que enseñar (sin sesión). */
export function etiquetaCorta(e: EstadoSync): string | null {
  switch (e.tipo) {
    case "local":
      return null;
    case "sincronizando":
      return "Sincronizando…";
    case "sincronizado":
      return "Sincronizado";
    case "sin-conexion":
      return e.pendientes > 0 ? `Sin conexión (${e.pendientes})` : "Sin conexión";
    case "error":
      return "Error de sync";
    case "cuenta-distinta":
      return "Elige cuenta";
  }
}
