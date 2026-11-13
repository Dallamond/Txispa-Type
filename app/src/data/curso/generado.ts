// Generado por scripts/generar-curso.mjs desde la lista CURSOS de tipos.ts.
// No editar a mano: se cambia el Markdown y se ejecuta `npm run curso:generar`.

import { MODULOS_HTML } from "./html";
import { MODULOS_CSS } from "./css";
import { MODULOS_LINUX } from "./linux";
import type { CursoId, Modulo } from "./tipos";

/** Módulos de cada curso tal como salen de los temarios (sin ordenar). */
export const MODULOS_GENERADOS: Readonly<Record<CursoId, readonly Modulo[]>> = {
  html: MODULOS_HTML,
  css: MODULOS_CSS,
  linux: MODULOS_LINUX,
};
