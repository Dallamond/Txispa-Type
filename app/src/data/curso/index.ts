// Punto de entrada del contenido de los cursos (los datos se generan con `npm run curso:generar`).

import { MODULOS_HTML } from "./html";
import { MODULOS_CSS } from "./css";
import { CURSOS, type CursoId, type Leccion, type Modulo } from "./tipos";

export { CURSOS, requisitoDe } from "./tipos";
export type { CursoId, InfoCurso, Leccion, Modulo } from "./tipos";

const porId = (a: Modulo, b: Modulo) => a.id.localeCompare(b.id);

/** Módulos de cada curso, en su orden (M01, M02…). */
export const MODULOS_POR_CURSO: Readonly<Record<CursoId, readonly Modulo[]>> = {
  html: [...MODULOS_HTML].sort(porId),
  css: [...MODULOS_CSS].sort(porId),
};

/** Los ids de curso en el orden en que se muestran. */
export const IDS_CURSOS = Object.keys(CURSOS) as CursoId[];

/** Todos los módulos, curso a curso. */
export const MODULOS: readonly Modulo[] = IDS_CURSOS.flatMap((c) => MODULOS_POR_CURSO[c]);

/** Todas las lecciones, curso a curso. */
export const LECCIONES: readonly Leccion[] = MODULOS.flatMap((m) => m.lecciones);

/** Módulos fuera de la ruta de su curso: abiertos desde el principio y sin desbloquear a otros (el diccionario).
 * Se identifican con la clave `curso/módulo`, porque `M13` puede repetirse en otro curso. */
const LIBRES: ReadonlySet<string> = new Set(["html/M13"]);

/** Clave única de un módulo entre todos los cursos: "html/M01". */
export function claveModulo(modulo: Modulo): string {
  return `${modulo.curso}/${modulo.id}`;
}

export function esModuloLibre(modulo: Modulo): boolean {
  return LIBRES.has(claveModulo(modulo));
}

/** Ids (dentro de su curso) de los módulos libres de un curso. */
export function libresDeCurso(curso: CursoId): readonly string[] {
  return MODULOS_POR_CURSO[curso].filter(esModuloLibre).map((m) => m.id);
}

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
