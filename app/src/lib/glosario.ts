// Notas del glosario para una línea de código. Lógica pura.

import {
  GLOSARIO_ATRIBUTOS,
  GLOSARIO_ETIQUETAS,
  GLOSARIO_PROPIEDADES,
  GLOSARIO_SELECTORES,
} from "../data/curso/glosario";

export interface Nota {
  /** Cómo se muestra: "<ul>", "href=", "<!-- -->", "display:", ".clase". */
  clave: string;
  texto: string;
}

/** Acumula notas sin repetir y respetando un máximo. */
function acumulador() {
  const notas: Nota[] = [];
  const vistas = new Set<string>();
  return {
    notas,
    añadir(id: string, clave: string, texto: string | undefined) {
      if (!texto || vistas.has(id)) return;
      vistas.add(id);
      notas.push({ clave, texto });
    },
  };
}

function notasHtml(linea: string, max: number): Nota[] {
  const { notas, añadir } = acumulador();
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

function notasCss(linea: string, max: number): Nota[] {
  const { notas, añadir } = acumulador();
  const t = linea.trim();

  const regla = /^(@media|@keyframes|@font-face)\b/.exec(t);
  if (regla) añadir(regla[1], regla[1], GLOSARIO_SELECTORES[regla[1]]);

  // Una línea de selector acaba en "{" o en "," (varios selectores). Las declaraciones no se miran aquí.
  if (!regla && (t.endsWith("{") || t.endsWith(","))) {
    if (/(^|[\s>+~,])\*/.test(t)) añadir("*", "*", GLOSARIO_SELECTORES["*"]);
    if (/(^|[\s>+~,\]])\.[a-z_-]/i.test(t)) añadir(".clase", ".clase", GLOSARIO_SELECTORES[".clase"]);
    if (/(^|[\s>+~,\]])#[a-z_-]/i.test(t)) añadir("#id", "#id", GLOSARIO_SELECTORES["#id"]);
    if (/\[[^\]]+\]/.test(t)) añadir("[atributo]", "[atributo]", GLOSARIO_SELECTORES["[atributo]"]);
    if (/::before/.test(t)) añadir("::before", "::before", GLOSARIO_SELECTORES["::before"]);
    if (/::after/.test(t)) añadir("::after", "::after", GLOSARIO_SELECTORES["::after"]);
    if (/[^:]:hover/.test(t)) añadir(":hover", ":hover", GLOSARIO_SELECTORES[":hover"]);
    if (/:nth-child/.test(t)) añadir(":nth-child", ":nth-child", GLOSARIO_SELECTORES[":nth-child"]);
  }

  const propiedad = /^([a-z][a-z-]*)\s*:\s/.exec(t);
  if (propiedad) añadir(`p:${propiedad[1]}`, `${propiedad[1]}:`, GLOSARIO_PROPIEDADES[propiedad[1]]);
  return notas.slice(0, max);
}

/** Notas de las etiquetas y atributos (HTML) o de los selectores y propiedades (CSS) de una línea,
 * en orden de aparición y sin repetir; como mucho `max`. */
export function notasDeLinea(linea: string, max = 3): Nota[] {
  // Es HTML si lleva una etiqueta, cierra un comentario o empieza por un atributo (etiqueta partida en varias líneas).
  const esHtml = linea.includes("<") || linea.includes("-->") || /^\s*[a-z][a-z-]*=/.test(linea);
  return esHtml ? notasHtml(linea, max) : notasCss(linea, max);
}
