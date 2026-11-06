// Tipos del curso de HTML y CSS. El contenido se genera desde docs/curso/TEMARIO-HTML-CSS.md
// (ver docs/curso/SPEC-FORMATO-LECCIONES.md §4).

export type CursoId = "html" | "css";

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
