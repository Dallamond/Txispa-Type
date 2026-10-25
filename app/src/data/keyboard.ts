import type { KeyDef } from "../types";

// Teclado ISO español. finger: 0=meñique izq … 7=meñique der, 8=pulgar.
export const KB_ROWS: KeyDef[][] = [
  [
    { id: "º", base: "º", shift: "ª", altgr: "\\", finger: 0 },
    { id: "1", base: "1", shift: "!", altgr: "|", finger: 0 },
    { id: "2", base: "2", shift: '"', altgr: "@", finger: 1 },
    { id: "3", base: "3", shift: "·", altgr: "#", finger: 2 },
    { id: "4", base: "4", shift: "$", altgr: "~", finger: 3 },
    { id: "5", base: "5", shift: "%", altgr: "€", finger: 3 },
    { id: "6", base: "6", shift: "&", altgr: "¬", finger: 4 },
    { id: "7", base: "7", shift: "/", finger: 4 },
    { id: "8", base: "8", shift: "(", finger: 5 },
    { id: "9", base: "9", shift: ")", finger: 6 },
    { id: "0", base: "0", shift: "=", finger: 7 },
    { id: "'", base: "'", shift: "?", finger: 7 },
    { id: "¡", base: "¡", shift: "¿", finger: 7 },
    { id: "Backspace", base: "⌫", finger: 7, cls: "wide" },
  ],
  [
    { id: "Tab", base: "⇥ tab", finger: 0, cls: "wide" },
    { id: "q", base: "q", finger: 0 },
    { id: "w", base: "w", finger: 1 },
    { id: "e", base: "e", finger: 2 },
    { id: "r", base: "r", finger: 3 },
    { id: "t", base: "t", finger: 3 },
    { id: "y", base: "y", finger: 4 },
    { id: "u", base: "u", finger: 4 },
    { id: "i", base: "i", finger: 5 },
    { id: "o", base: "o", finger: 6 },
    { id: "p", base: "p", finger: 7 },
    { id: "`", base: "`", shift: "^", altgr: "[", finger: 7 },
    { id: "+", base: "+", shift: "*", altgr: "]", finger: 7 },
  ],
  [
    { id: "Caps", base: "⇪", finger: 0, cls: "wide" },
    { id: "a", base: "a", finger: 0 },
    { id: "s", base: "s", finger: 1 },
    { id: "d", base: "d", finger: 2 },
    { id: "f", base: "f", finger: 3 },
    { id: "g", base: "g", finger: 3 },
    { id: "h", base: "h", finger: 4 },
    { id: "j", base: "j", finger: 4 },
    { id: "k", base: "k", finger: 5 },
    { id: "l", base: "l", finger: 6 },
    { id: "ñ", base: "ñ", finger: 7 },
    { id: "´", base: "´", shift: "¨", altgr: "{", finger: 7 },
    { id: "ç", base: "ç", altgr: "}", finger: 7 },
    { id: "Enter", base: "⏎", finger: 7, cls: "wide" },
  ],
  [
    { id: "ShiftL", base: "⇧ shift", finger: 0, cls: "xwide" },
    { id: "<", base: "<", shift: ">", finger: 0 },
    { id: "z", base: "z", finger: 0 },
    { id: "x", base: "x", finger: 1 },
    { id: "c", base: "c", finger: 2 },
    { id: "v", base: "v", finger: 3 },
    { id: "b", base: "b", finger: 3 },
    { id: "n", base: "n", finger: 4 },
    { id: "m", base: "m", finger: 4 },
    { id: ",", base: ",", shift: ";", finger: 5 },
    { id: ".", base: ".", shift: ":", finger: 6 },
    { id: "-", base: "-", shift: "_", finger: 7 },
    { id: "ShiftR", base: "⇧ shift", finger: 7, cls: "xwide" },
  ],
  [
    { id: "Space", base: "espacio", finger: 8, cls: "space" },
    { id: "AltGr", base: "alt gr", finger: 8, cls: "wide" },
  ],
];

export const FINGER_NAMES = [
  "meñique izquierdo",
  "anular izquierdo",
  "corazón izquierdo",
  "índice izquierdo",
  "índice derecho",
  "corazón derecho",
  "anular derecho",
  "meñique derecho",
  "pulgar",
];

export interface CharInfo {
  key: string;
  shift?: boolean;
  altgr?: boolean;
  /** Tecla muerta previa (el acento `´`): las vocales con tilde y la diéresis. */
  dead?: string;
  /** La tecla muerta se pulsa con shift (diéresis `¨`). */
  deadShift?: boolean;
}

export const CHARMAP: Record<string, CharInfo> = {};
KB_ROWS.flat().forEach((k) => {
  if (k.base.length === 1) CHARMAP[k.base] = CHARMAP[k.base] || { key: k.id };
  if (k.shift) CHARMAP[k.shift] = { key: k.id, shift: true };
  if (k.altgr) CHARMAP[k.altgr] = { key: k.id, altgr: true };
});
"abcdefghijklmnopqrstuvwxyzñç".split("").forEach((c) => {
  CHARMAP[c.toUpperCase()] = { key: c, shift: true };
});
// Vocales con tilde: tecla muerta `´` y después la vocal. Diéresis: shift+`´`.
for (const [con, sin] of [["á", "a"], ["é", "e"], ["í", "i"], ["ó", "o"], ["ú", "u"]]) {
  CHARMAP[con] = { key: sin, dead: "´" };
  CHARMAP[con.toUpperCase()] = { key: sin, shift: true, dead: "´" };
}
CHARMAP["ü"] = { key: "u", dead: "´", deadShift: true };
CHARMAP["Ü"] = { key: "u", shift: true, dead: "´", deadShift: true };
CHARMAP[" "] = { key: "Space" };
CHARMAP["\n"] = { key: "Enter" };

export const KEY_BY_ID: Record<string, KeyDef> = Object.fromEntries(
  KB_ROWS.flat().map((k) => [k.id, k])
);
