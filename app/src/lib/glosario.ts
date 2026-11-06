// Notas del glosario para una línea de código. Lógica pura.

import { GLOSARIO_ATRIBUTOS, GLOSARIO_ETIQUETAS } from "../data/curso/glosario";

export interface Nota {
  /** Cómo se muestra: "<ul>", "href=", "<!-- -->". */
  clave: string;
  texto: string;
}

/** Notas de las etiquetas y atributos de una línea de código, en orden de aparición y sin repetir.
 * Primero las etiquetas y después los atributos; como mucho `max`. */
export function notasDeLinea(linea: string, max = 3): Nota[] {
  const notas: Nota[] = [];
  const vistas = new Set<string>();
  const añadir = (id: string, clave: string, texto: string | undefined) => {
    if (!texto || vistas.has(id)) return;
    vistas.add(id);
    notas.push({ clave, texto });
  };

  if (linea.includes("<!--") || linea.includes("-->")) {
    añadir("!--", "<!-- -->", GLOSARIO_ETIQUETAS["!--"]);
  }
  // El texto de un comentario de una sola línea no se interpreta (no es código).
  const codigo = linea.replace(/<!--.*?-->/g, "");

  for (const m of codigo.matchAll(/<(!doctype|\/?[a-z][a-z0-9]*)/gi)) {
    const nombre = m[1].replace(/^\//, "").toLowerCase();
    añadir(nombre, nombre === "!doctype" ? "<!DOCTYPE>" : `<${nombre}>`, GLOSARIO_ETIQUETAS[nombre]);
  }
  // Un atributo va tras un espacio, o al principio de la línea si la etiqueta se parte en varias.
  for (const m of codigo.matchAll(/(?:^|\s)([a-z][a-z-]*)=/g)) {
    añadir(`@${m[1]}`, `${m[1]}=`, GLOSARIO_ATRIBUTOS[m[1]]);
  }
  return notas.slice(0, max);
}
