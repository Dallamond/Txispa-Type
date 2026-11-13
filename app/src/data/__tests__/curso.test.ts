// Validaciones del contenido del curso (docs/curso/SPEC-FORMATO-LECCIONES.md §7).
// Si una lección falla, el mensaje lleva su id.

import { describe, it, expect } from "vitest";
import { CHARMAP } from "../keyboard";
import { MODULOS, LECCIONES, buscarLeccion, idLeccion } from "../curso";
import type { Leccion, Modulo } from "../curso";

/** Etiquetas HTML que no se cierran. */
const VACIAS = new Set(["br", "hr", "img", "meta", "link", "input", "source", "track", "col", "area", "base", "embed", "wbr"]);

const conModulo = MODULOS.flatMap((m) => m.lecciones.map((l) => ({ l, m: m as Modulo })));

/** Quita los comentarios HTML (también los de varias líneas). */
const sinComentarios = (codigo: string) => codigo.replace(/<!--[\s\S]*?-->/g, "");

/** Devuelve el problema de etiquetas mal cerradas, o null si está bien formado. */
function problemaDeEtiquetas(codigo: string): string | null {
  const pila: string[] = [];
  for (const m of sinComentarios(codigo).matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g)) {
    const [, cierre, nombre] = m;
    const tag = nombre.toLowerCase();
    if (VACIAS.has(tag)) continue;
    if (!cierre) pila.push(tag);
    else if (pila.pop() !== tag) return `</${tag}> no coincide con la etiqueta abierta`;
  }
  return pila.length > 0 ? `etiquetas sin cerrar: ${pila.join(", ")}` : null;
}

/** Revisa llaves balanceadas y `;` en cada declaración de un trozo de CSS. */
function problemaDeCss(css: string): string | null {
  let prof = 0;
  for (const linea of css.split("\n")) {
    const t = linea.trim();
    if (t === "") continue;
    if (prof > 0 && !t.endsWith("{") && !t.endsWith("}") && !t.endsWith(";")) return `declaración sin ";": ${t}`;
    for (const ch of t) {
      if (ch === "{") prof++;
      if (ch === "}") prof--;
      if (prof < 0) return "llave de cierre de más";
    }
  }
  return prof === 0 ? null : "llaves sin cerrar";
}

/** Para un fragmento HTML, el CSS que lleva dentro de <style>. */
const cssDentroDeStyle = (codigo: string) =>
  [...codigo.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");

describe("estructura del curso", () => {
  it("hay 13 módulos con su repaso al final", () => {
    expect(MODULOS).toHaveLength(13);
    for (const m of MODULOS) {
      const repasos = m.lecciones.filter((l) => l.tipo === "repaso");
      expect(repasos, m.id).toHaveLength(1);
      expect(m.lecciones[m.lecciones.length - 1].tipo, m.id).toBe("repaso");
    }
  });

  it("ids únicos y coherentes con su módulo, y dificultad de 1 a 5", () => {
    const vistos = new Set<string>();
    for (const { l, m } of conModulo) {
      expect(vistos.has(l.id), `${l.id} repetido`).toBe(false);
      vistos.add(l.id);
      expect(l.id, l.id).toMatch(/^L\d{2}\.(\d{2}|R)$/);
      expect(l.id.slice(1, 3), l.id).toBe(m.id.slice(1, 3));
      expect(l.tipo === "repaso", l.id).toBe(l.id.endsWith(".R"));
      expect(l.dificultad, l.id).toBeGreaterThanOrEqual(1);
      expect(l.dificultad, l.id).toBeLessThanOrEqual(5);
    }
  });

  it("buscarLeccion encuentra una lección por su id de intento", () => {
    const m = MODULOS[0];
    const l = m.lecciones[0];
    expect(buscarLeccion(idLeccion(m, l))?.leccion).toBe(l);
    expect(buscarLeccion("html/L99.99")).toBeNull();
  });
});

describe("formato del código de cada lección", () => {
  for (const { l } of conModulo) {
    it(`${l.id} · ${l.titulo}: longitud, sangría y espacios`, () => {
      const lineas = l.codigo.split("\n");
      const [min, max] = l.tipo === "repaso" ? [12, 25] : [6, 15];
      expect(lineas.length, `${l.id}: ${lineas.length} líneas (debe estar entre ${min} y ${max})`).toBeGreaterThanOrEqual(min);
      expect(lineas.length, `${l.id}: ${lineas.length} líneas (debe estar entre ${min} y ${max})`).toBeLessThanOrEqual(max);
      expect(l.codigo, `${l.id}: tabuladores`).not.toContain("\t");
      lineas.forEach((linea, i) => {
        const donde = `${l.id}, línea ${i + 1}`;
        expect(linea.trim(), `${donde}: línea en blanco`).not.toBe("");
        expect(linea, `${donde}: espacios al final`).toBe(linea.trimEnd());
        const sangria = linea.length - linea.trimStart().length;
        expect(sangria % 2, `${donde}: sangría no múltiplo de 2`).toBe(0);
        expect(linea.trimStart(), `${donde}: espacios dobles`).not.toMatch(/ {2}/);
      });
    });

    it(`${l.id}: todos los caracteres se pueden teclear`, () => {
      for (const ch of l.codigo.replace(/ /g, "")) {
        expect(ch === "\n" || CHARMAP[ch] !== undefined, `${l.id}: "${ch}" no está en CHARMAP`).toBe(true);
      }
    });

    it(`${l.id}: código bien formado`, () => {
      // Si empieza por "<" es HTML (con posible <style> dentro); si no, es CSS suelto.
      const esHtml = l.codigo.trimStart().startsWith("<");
      if (esHtml) {
        expect(problemaDeEtiquetas(l.codigo), `${l.id}: etiquetas`).toBeNull();
        const css = cssDentroDeStyle(l.codigo);
        if (css) expect(problemaDeCss(css), `${l.id}: CSS dentro de <style>`).toBeNull();
      } else {
        expect(problemaDeCss(l.codigo), `${l.id}: CSS`).toBeNull();
      }
    });
  }
});

describe("símbolos nuevos y explicaciones", () => {
  it("cada símbolo nuevo aparece en su código y no se había estrenado antes", () => {
    const estrenados = new Set<string>();
    for (const l of LECCIONES) {
      for (const s of l.nuevas) {
        expect(s.length, `${l.id}: "${s}" no es un solo carácter`).toBe(1);
        expect(l.codigo.includes(s), `${l.id}: "${s}" no aparece en el código`).toBe(true);
        expect(estrenados.has(s), `${l.id}: "${s}" ya se estrenó antes`).toBe(false);
        estrenados.add(s);
      }
    }
  });

  it("la explicación tiene de 1 a 4 frases", () => {
    const frases = (t: Leccion["explicacion"]) =>
      (t.replace(/`[^`]*`/g, "x").match(/[.!?](?=\s|$)/g) ?? []).length;
    for (const l of LECCIONES) {
      const n = frases(l.explicacion);
      expect(n, `${l.id}: ${n} frases`).toBeGreaterThanOrEqual(1);
      expect(n, `${l.id}: ${n} frases`).toBeLessThanOrEqual(4);
    }
  });
});
