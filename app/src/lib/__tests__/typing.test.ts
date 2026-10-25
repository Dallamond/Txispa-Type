import { describe, it, expect } from "vitest";
import {
  isModifier,
  modifierLabel,
  pressedKeyFor,
  charState,
  esAtajo,
} from "../typing";

describe("isModifier", () => {
  it("reconoce teclas modificadoras", () => {
    for (const k of ["Shift", "Alt", "Control", "Meta", "AltGraph", "Tab", "CapsLock"]) {
      expect(isModifier(k)).toBe(true);
    }
  });

  it("rechaza caracteres normales", () => {
    for (const k of ["a", "A", "1", "Enter", " ", "ArrowUp"]) {
      expect(isModifier(k)).toBe(false);
    }
  });
});

describe("modifierLabel", () => {
  it('devuelve "ShiftL" para Shift', () => {
    expect(modifierLabel("Shift")).toBe("ShiftL");
  });

  it('devuelve "AltGr" para AltGraph', () => {
    expect(modifierLabel("AltGraph")).toBe("AltGr");
  });

  it("devuelve null para los demás modificadores", () => {
    expect(modifierLabel("Control")).toBeNull();
    expect(modifierLabel("Alt")).toBeNull();
    expect(modifierLabel("Meta")).toBeNull();
    expect(modifierLabel("Tab")).toBeNull();
    expect(modifierLabel("CapsLock")).toBeNull();
  });

  it("devuelve null para teclas no-modificadoras", () => {
    expect(modifierLabel("a")).toBeNull();
    expect(modifierLabel("F5")).toBeNull();
  });
});

describe("pressedKeyFor", () => {
  it('mapea espacio a "Space"', () => {
    expect(pressedKeyFor(" ")).toBe("Space");
  });

  it("normaliza a minúsculas", () => {
    expect(pressedKeyFor("A")).toBe("a");
    expect(pressedKeyFor("Enter")).toBe("enter");
  });
});

describe("charState", () => {
  it('devuelve "pending" cuando i está fuera del rango tecleado', () => {
    expect(charState("hola", "", 0)).toBe("pending");
    expect(charState("hola", "h", 1)).toBe("pending");
    expect(charState("hola", "hola", 4)).toBe("pending");
  });

  it('devuelve "ok" cuando el carácter coincide', () => {
    expect(charState("hola", "hola", 0)).toBe("ok");
    expect(charState("hola", "hola", 3)).toBe("ok");
  });

  it('devuelve "err" cuando el carácter no coincide', () => {
    expect(charState("hola", "hxla", 1)).toBe("err");
    expect(charState("hola", "holx", 3)).toBe("err");
  });
});

describe("esAtajo", () => {
  const ev = (o: Partial<KeyboardEvent>) => o as KeyboardEvent;

  it("Ctrl o Meta solos son atajos del navegador", () => {
    expect(esAtajo(ev({ ctrlKey: true, altKey: false }))).toBe(true);
    expect(esAtajo(ev({ metaKey: true, altKey: false }))).toBe(true);
  });

  it("AltGr (Ctrl+Alt en teclado español) NO es un atajo", () => {
    expect(esAtajo(ev({ ctrlKey: true, altKey: true }))).toBe(false);
  });

  it("una tecla normal no es un atajo", () => {
    expect(esAtajo(ev({ ctrlKey: false, metaKey: false, altKey: false }))).toBe(false);
  });
});
