// Utilidades compartidas del motor de tecleo, para no duplicar la lógica entre
// Practice.tsx y BossBattle.tsx (y evitar que futuros jefes copien bugs sutiles).

/** Teclas modificadoras que no producen carácter y no deben contar como fallo. */
const MODIFIERS = new Set([
  "Shift",
  "Alt",
  "Control",
  "Meta",
  "AltGraph",
  "Tab",
  "CapsLock",
]);

export function isModifier(key: string): boolean {
  return MODIFIERS.has(key);
}

/** Etiqueta de tecla resaltada para un modificador, o null si no hay que
 * resaltar nada (Ctrl/Alt/Meta/Tab/CapsLock). */
export function modifierLabel(key: string): string | null {
  if (key === "AltGraph") return "AltGr";
  if (key === "Shift") return "ShiftL";
  return null;
}

/** Etiqueta de la tecla pulsada (para el resaltado del teclado virtual). */
export function pressedKeyFor(key: string): string {
  return key === " " ? "Space" : key.toLowerCase();
}

/** Estado visual de un carácter respecto a lo tecleado. */
export type CharState = "pending" | "ok" | "err";

export function charState(target: string, typed: string, i: number): CharState {
  if (i >= typed.length) return "pending";
  return typed[i] === target[i] ? "ok" : "err";
}

/** Combinación del navegador (Ctrl+R, Ctrl+V, ⌘+L…) en vez de un carácter.
 *
 * Sin esto, la `e.key` de Ctrl+R es `"r"`: se la comía el `preventDefault` —o
 * sea que dentro de una pantalla de tecleo dejaban de funcionar los atajos del
 * navegador— y encima contaba como pulsación FALLADA. Recargar la página te
 * bajaba la precisión.
 *
 * El `&& !e.altKey` no es un adorno: en el teclado español AltGr llega como
 * Ctrl+Alt, y de AltGr salen `|`, `~`, `\`, `@` y `#`, que en una app de
 * comandos de Linux son media sintaxis. Filtrar por `ctrlKey` a secas dejaría
 * el pipe sin poder teclearse. */
export function esAtajo(e: KeyboardEvent): boolean {
  return (e.ctrlKey || e.metaKey) && !e.altKey;
}
