// Tipos de los cursos. El contenido se genera desde docs/curso/TEMARIO-HTML-CSS.md
// (ver docs/curso/SPEC-FORMATO-LECCIONES.md §4).

export interface InfoCurso {
  /** Nombre en pantalla: "HTML". */
  nombre: string;
  /** Una frase para la tarjeta del curso. */
  descripcion: string;
  /** Curso que hay que completar (su ruta, sin los módulos libres) para abrir este. Debe ir antes en `CURSOS`. */
  requiere?: string;
}

/** Cursos que existen, en el orden en que se muestran. Para añadir uno: docs/curso/AÑADIR-CURSO.md. */
export const CURSOS = {
  html: { nombre: "HTML", descripcion: "Estructura, texto, enlaces, tablas, formularios y semántica de HTML5." },
  css: { nombre: "CSS", descripcion: "Estilos, modelo de caja, Flexbox, Grid, diseño adaptable y animaciones.", requiere: "html" },
} as const satisfies Record<string, InfoCurso>;
export type CursoId = keyof typeof CURSOS;

export interface Leccion {
  /** "L01.01"; el repaso del módulo es "L01.R". Único en todo el curso. */
  id: string;
  moduloId: string;
  titulo: string;
  tipo: "leccion" | "repaso";
  dificultad: 1 | 2 | 3 | 4 | 5;
  /** Símbolos que se estrenan en la lección (para el aviso previo y el teclado). */
  nuevas: string[];
  explicacion: string;
  /** Código tal cual, con "\n" y sangría de 2 espacios. Sin tabuladores. */
  codigo: string;
}

export interface Modulo {
  /** "M01". */
  id: string;
  curso: CursoId;
  titulo: string;
  descripcion: string;
  lecciones: Leccion[];
}

/** Curso que hay que completar antes de abrir este, si lo tiene. */
export function requisitoDe(id: CursoId): CursoId | undefined {
  const requiere = (CURSOS[id] as InfoCurso).requiere;
  return requiere === undefined ? undefined : (requiere as CursoId);
}
