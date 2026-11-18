// Datos de presentación del catálogo de cursos: totales, texto del botón e icono de cada módulo.

import { esModuloLibre, type Modulo } from "../data/curso";

export interface TotalesCurso {
  /** Módulos de la ruta (sin los libres). */
  modulos: number;
  /** Lecciones de la ruta: las mismas que cuenta el avance `hechas/total`. */
  lecciones: number;
  /** Módulos libres (el diccionario), abiertos desde el principio y fuera de la ruta. */
  libres: number;
}

/** Cuántos módulos y lecciones tiene la ruta de un curso, y cuántos módulos libres aparte. */
export function totalesDeCurso(modulos: readonly Modulo[]): TotalesCurso {
  const ruta = modulos.filter((m) => !esModuloLibre(m));
  return { modulos: ruta.length, lecciones: ruta.reduce((n, m) => n + m.lecciones.length, 0), libres: modulos.length - ruta.length };
}

/** Texto del botón de una tarjeta de curso según lo avanzado. */
export function accionDeCurso(hechas: number, total: number): "Empezar" | "Continuar" | "Repasar" {
  if (hechas <= 0) return "Empezar";
  return hechas >= total ? "Repasar" : "Continuar";
}

/** "1 módulo" / "7 módulos". */
export function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}

/** Glifo del marcador de posición de la imagen de cada curso. */
const GLIFOS: Readonly<Record<string, string>> = { html: "</>", css: "{ }", linux: "$_" };

export function glifoDeCurso(curso: string): string {
  return GLIFOS[curso] ?? "···";
}

const SIN_ICONO = "▫";

/** Icono de cada módulo, por su clave `curso/módulo`. */
const ICONOS: Readonly<Record<string, string>> = {
  "html/M01": "🧱",
  "html/M02": "🔤",
  "html/M03": "🔗",
  "html/M04": "📋",
  "html/M05": "♿",
  "html/M13": "📖",
  "css/M06": "🎨",
  "css/M07": "📦",
  "css/M08": "📐",
  "css/M09": "🧩",
  "css/M10": "📱",
  "css/M11": "✨",
  "css/M12": "✅",
  "linux/M01": "📁",
  "linux/M02": "🌐",
  "linux/M03": "🔐",
  "linux/M04": "👤",
  "linux/M05": "⚙️",
  "linux/M06": "💾",
  "linux/M07": "🔀",
  "linux/M08": "🏠",
};

export function iconoDeModulo(modulo: Pick<Modulo, "curso" | "id">): string {
  return ICONOS[`${modulo.curso}/${modulo.id}`] ?? SIN_ICONO;
}
