import { describe, it, expect } from "vitest";
import { notasDeLinea } from "../glosario";
import { GLOSARIO_ATRIBUTOS, GLOSARIO_ETIQUETAS, GLOSARIO_PROPIEDADES, GLOSARIO_SELECTORES } from "../../data/curso/glosario";
import { LECCIONES } from "../../data/curso";

describe("notasDeLinea", () => {
  it("una etiqueta de apertura y su cierre dan una sola nota", () => {
    expect(notasDeLinea("<ul></ul>")).toEqual([{ clave: "<ul>", texto: GLOSARIO_ETIQUETAS.ul }]);
  });

  it("varias etiquetas, en orden de aparición y como mucho tres", () => {
    const n = notasDeLinea("<li><a href=\"x\"><strong>Inicio</strong></a></li>");
    expect(n.map((x) => x.clave)).toEqual(["<li>", "<a>", "<strong>"]);
  });

  it("los atributos van detrás de las etiquetas", () => {
    const n = notasDeLinea('<a href="x" class="y">', 5);
    expect(n.map((x) => x.clave)).toEqual(["<a>", "href=", "class="]);
  });

  it("un atributo que abre la línea (etiqueta partida en varias líneas) también tiene nota", () => {
    expect(notasDeLinea('src="logo.png"').map((x) => x.clave)).toEqual(["src="]);
    expect(notasDeLinea('height="200">').map((x) => x.clave)).toEqual(["height="]);
  });

  it("el doctype tiene su nota", () => {
    expect(notasDeLinea("<!DOCTYPE html>")[0].clave).toBe("<!DOCTYPE>");
  });

  it("un comentario da la nota de comentario y su texto no se interpreta", () => {
    expect(notasDeLinea("<!-- Esto es un comentario -->").map((x) => x.clave)).toEqual(["<!-- -->"]);
    expect(notasDeLinea("<p></p> <!-- parrafo con <b> dentro -->").map((x) => x.clave)).toEqual(["<!-- -->", "<p>"]);
    expect(notasDeLinea("-->").map((x) => x.clave)).toEqual(["<!-- -->"]);
  });

  it("una etiqueta que no está en el glosario no da nota", () => {
    expect(notasDeLinea("<inventada>")).toEqual([]);
  });
});

describe("cobertura del glosario", () => {
  it("todas las etiquetas y atributos que usa el curso tienen nota", () => {
    const sinNota: string[] = [];
    for (const l of LECCIONES) {
      const codigo = l.codigo.replace(/<!--[\s\S]*?-->/g, "");
      for (const m of codigo.matchAll(/<\/?([a-z][a-z0-9]*)/gi)) {
        if (!GLOSARIO_ETIQUETAS[m[1].toLowerCase()]) sinNota.push(`${l.id}: <${m[1]}>`);
      }
      for (const m of codigo.matchAll(/\s([a-z][a-z-]*)="/g)) {
        if (!GLOSARIO_ATRIBUTOS[m[1]]) sinNota.push(`${l.id}: ${m[1]}=`);
      }
    }
    expect([...new Set(sinNota)]).toEqual([]);
  });
});

describe("notas de CSS", () => {
  it("una declaración da la nota de su propiedad", () => {
    expect(notasDeLinea("  display: flex;")).toEqual([{ clave: "display:", texto: GLOSARIO_PROPIEDADES.display }]);
    expect(notasDeLinea("grid-template-columns: repeat(3, 1fr);")[0].clave).toBe("grid-template-columns:");
  });

  it("los selectores dan nota según su tipo", () => {
    expect(notasDeLinea(".tarjeta {").map((x) => x.clave)).toEqual([".clase"]);
    expect(notasDeLinea("#principal {").map((x) => x.clave)).toEqual(["#id"]);
    expect(notasDeLinea("* {").map((x) => x.clave)).toEqual(["*"]);
    expect(notasDeLinea("a:hover {").map((x) => x.clave)).toEqual([":hover"]);
    expect(notasDeLinea("p:nth-child(even) {").map((x) => x.clave)).toEqual([":nth-child"]);
    expect(notasDeLinea("input[type=\"text\"] {").map((x) => x.clave)).toEqual(["[atributo]"]);
    expect(notasDeLinea("*::before,").map((x) => x.clave)).toEqual(["*", "::before"]);
  });

  it("las reglas @ dan su nota", () => {
    expect(notasDeLinea("@media (max-width: 768px) {").map((x) => x.clave)).toEqual(["@media"]);
    expect(notasDeLinea("@keyframes mover {")[0].texto).toBe(GLOSARIO_SELECTORES["@keyframes"]);
    expect(notasDeLinea("@font-face {")[0].clave).toBe("@font-face");
  });

  it("una declaración no se confunde con un selector con pseudoclase", () => {
    expect(notasDeLinea("color: red;").map((x) => x.clave)).toEqual(["color:"]);
    expect(notasDeLinea("}")).toEqual([]);
    expect(notasDeLinea("0% {")).toEqual([]);
  });
});

describe("cobertura del glosario CSS", () => {
  it("toda propiedad que usa el curso tiene nota", () => {
    const sinNota: string[] = [];
    for (const l of LECCIONES) {
      for (const linea of l.codigo.split("\n")) {
        if (linea.includes("<")) continue; // HTML
        const m = /^\s*([a-z][a-z-]*)\s*:\s/.exec(linea);
        if (m && !GLOSARIO_PROPIEDADES[m[1]]) sinNota.push(`${l.id}: ${m[1]}`);
      }
    }
    expect([...new Set(sinNota)]).toEqual([]);
  });
});
