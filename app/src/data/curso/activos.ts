// Módulos del curso que ya se ven en la pantalla Curso. Se van añadiendo de uno en uno
// (un push por módulo) para revisarlos con el teclado antes de abrir el siguiente.
// Al activar M12 esta lista deja de hacer falta y se retira (ver docs/FASES.md, Fase 6).

import { MODULOS } from "./index";
import type { Modulo } from "./tipos";

export const MODULOS_ACTIVOS: readonly string[] = ["M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10", "M13"];

/** Módulos visibles, en orden del curso. */
export const MODULOS_VISIBLES: readonly Modulo[] = MODULOS.filter((m) => MODULOS_ACTIVOS.includes(m.id));
