import { describe, it, expect } from "vitest";
import { notasDeLinea } from "../glosario";
import { GLOSARIO_ATRIBUTOS, GLOSARIO_ETIQUETAS } from "../../data/curso/glosario";
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

  it("el doctype tiene su nota", () => {
    expect(notasDeLinea("<!DOCTYPE html>")[0].clave).toBe("<!DOCTYPE>");
  });

  it("un comentario da la nota de comentario y su texto no se interpreta", () => {
    expect(notasDeLinea("<!-- Esto es un comentario -->").map((x) => x.clave)).toEqual(["<!-- -->"]);
    expect(notasDeLinea("<p></p> <!-- parrafo con <b> dentro -->").map((x) => x.clave)).toEqual(["<!-- -->", "<p>"]);
    expect(notasDeLinea("-->").map((x) => x.clave)).toEqual(["<!-- -->"]);
  });

  it("una etiqueta que no está en el glosario no da nota; el CSS tampoco", () => {
    expect(notasDeLinea("<inventada>")).toEqual([]);
    expect(notasDeLinea("  color: red;")).toEqual([]);
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
