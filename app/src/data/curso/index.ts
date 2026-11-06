// Punto de entrada del contenido del curso (los datos se generan con `npm run curso:generar`).

import { MODULOS_HTML } from "./html";
import { MODULOS_CSS } from "./css";
import type { Leccion, Modulo } from "./tipos";

export { CURSOS } from "./tipos";
export type { CursoId, Leccion, Modulo } from "./tipos";

/** Todos los módulos en el orden del curso (M01, M02…). */
export const MODULOS: readonly Modulo[] = [...MODULOS_HTML, ...MODULOS_CSS].sort((a, b) => a.id.localeCompare(b.id));

/** Todas las lecciones en el orden del curso. */
export const LECCIONES: readonly Leccion[] = MODULOS.flatMap((m) => m.lecciones);

/** Módulos fuera de la ruta del curso: abiertos desde el principio y sin desbloquear a otros (el diccionario). */
export const MODULOS_LIBRES: readonly string[] = ["M13"];

/** Identificador que se guarda en el intento: "html/L01.01". */
export function idLeccion(modulo: Modulo, leccion: Leccion): string {
  return `${modulo.curso}/${leccion.id}`;
}

/** Busca una lección por su identificador de intento ("html/L01.01"). */
export function buscarLeccion(leccionId: string): { modulo: Modulo; leccion: Leccion } | null {
  for (const modulo of MODULOS) {
    for (const leccion of modulo.lecciones) {
      if (idLeccion(modulo, leccion) === leccionId) return { modulo, leccion };
    }
  }
  return null;
}
