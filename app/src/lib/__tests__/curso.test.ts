import { describe, it, expect } from "vitest";
import { aTexto, leccionSuperada, lineasDeTokens, PRECISION_LECCION, tokenizar } from "../curso";
import { LECCIONES } from "../../data/curso";

describe("tokenizar", () => {
  it("el ejemplo de la especificación: sangría que pone la app, cierres y último token", () => {
    expect(tokenizar("<ul>\n  <li>Pan</li>\n</ul>")).toEqual([
      { texto: "<ul>", cierre: "\n", sangriaSiguiente: 2 },
      { texto: "<li>Pan</li>", cierre: "\n", sangriaSiguiente: 0 },
      { texto: "</ul>", cierre: "", sangriaSiguiente: 0 },
    ]);
  });

  it("una línea con varios espacios simples da varios tokens que cierran con espacio", () => {
    expect(tokenizar("<p>Hola mundo bonito</p>")).toEqual([
      { texto: "<p>Hola", cierre: " ", sangriaSiguiente: 0 },
      { texto: "mundo", cierre: " ", sangriaSiguiente: 0 },
      { texto: "bonito</p>", cierre: "", sangriaSiguiente: 0 },
    ]);
  });

  it("la sangría de la línea siguiente cuelga del último token de la línea", () => {
    const t = tokenizar("a b\n    c d\n  e");
    expect(t.map((x) => [x.texto, x.cierre, x.sangriaSiguiente])).toEqual([
      ["a", " ", 0],
      ["b", "\n", 4],
      ["c", " ", 0],
      ["d", "\n", 2],
      ["e", "", 0],
    ]);
  });

  it("un solo token es el último y no lleva cierre", () => {
    expect(tokenizar("<br>")).toEqual([{ texto: "<br>", cierre: "", sangriaSiguiente: 0 }]);
  });

  it("rechaza lo que no se puede teclear token a token", () => {
    expect(() => tokenizar("a\n\nb")).toThrow(/línea 2/);
    expect(() => tokenizar("a  b")).toThrow(/espacios dobles/);
    expect(() => tokenizar("  a\nb")).toThrow(/sangría/);
  });
});

describe("aTexto", () => {
  it("devuelve el código original", () => {
    const codigo = "<ul>\n  <li>Pan</li>\n  <li>Leche</li>\n</ul>";
    expect(aTexto(tokenizar(codigo))).toBe(codigo);
  });

  it("reconstruye cada lección del curso (y se pueden tokenizar todas)", () => {
    for (const l of LECCIONES) expect(aTexto(tokenizar(l.codigo)), l.id).toBe(l.codigo);
  });
});

describe("lineasDeTokens", () => {
  it("reparte los tokens por líneas con su sangría", () => {
    const lineas = lineasDeTokens(tokenizar("<ul>\n  <li>Pan y vino</li>\n</ul>"));
    expect(lineas).toEqual([
      { sangria: 0, tokens: [0] },
      { sangria: 2, tokens: [1, 2, 3] },
      { sangria: 0, tokens: [4] },
    ]);
  });
});

describe("leccionSuperada", () => {
  it("exige la precisión mínima y no mira la velocidad", () => {
    expect(PRECISION_LECCION).toBe(95);
    expect(leccionSuperada({ acc: 95 })).toBe(true);
    expect(leccionSuperada({ acc: 100 })).toBe(true);
    expect(leccionSuperada({ acc: 94.9 })).toBe(false);
  });
});
