import { describe, it, expect } from "vitest";
import { KB_ROWS, CHARMAP, KEY_BY_ID, FINGER_NAMES } from "../keyboard";
import { TEXTOS } from "../textos";

describe("teclado ISO español", () => {
  it("los ids de tecla son únicos", () => {
    const ids = KB_ROWS.flat().map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada dedo tiene nombre", () => {
    for (const k of KB_ROWS.flat()) expect(FINGER_NAMES[k.finger]).toBeDefined();
  });

  it("v y b van con el índice izquierdo; ñ con el meñique derecho", () => {
    expect(KEY_BY_ID["v"].finger).toBe(3);
    expect(KEY_BY_ID["b"].finger).toBe(3);
    expect(KEY_BY_ID["ñ"].finger).toBe(7);
  });

  it("las mayúsculas salen con shift sobre la misma tecla", () => {
    expect(CHARMAP["A"]).toEqual({ key: "a", shift: true });
    expect(CHARMAP["Ñ"]).toEqual({ key: "ñ", shift: true });
  });

  it("los símbolos de AltGr se resuelven", () => {
    expect(CHARMAP["@"]).toEqual({ key: "2", altgr: true });
  });

  it("las vocales con tilde usan la tecla muerta y la vocal", () => {
    expect(CHARMAP["á"]).toEqual({ key: "a", dead: "´" });
    expect(CHARMAP["É"]).toEqual({ key: "e", shift: true, dead: "´" });
    expect(CHARMAP["ü"]).toEqual({ key: "u", dead: "´", deadShift: true });
    expect(KEY_BY_ID["´"]).toBeDefined();
  });

  it("el espacio está mapeado", () => {
    expect(CHARMAP[" "]).toEqual({ key: "Space" });
  });
});

describe("banco de textos", () => {
  it("todos los caracteres se pueden teclear con el teclado ISO español", () => {
    const sinTecla = new Set<string>();
    for (const t of TEXTOS) for (const ch of t) if (!CHARMAP[ch]) sinTecla.add(ch);
    expect([...sinTecla]).toEqual([]);
  });

  it("no hay saltos de línea ni espacios dobles", () => {
    for (const t of TEXTOS) {
      expect(t).not.toMatch(/\n|\s{2,}/);
      expect(t).toBe(t.trim());
    }
  });
});
