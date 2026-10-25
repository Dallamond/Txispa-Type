import { useMemo } from "react";
import { KB_ROWS, CHARMAP, KEY_BY_ID, FINGER_NAMES } from "../data/keyboard";

interface Props {
  nextChar?: string | null;
  pressedKey?: string | null;
  guide: boolean;
  /** Mapa de calor: id de tecla -> 0..1. Una tecla ausente se pinta como "sin datos". */
  calor?: Record<string, number>;
}

export default function VirtualKeyboard({ nextChar = null, pressedKey = null, guide, calor }: Props) {
  const highlight = useMemo(() => {
    if (!nextChar) return { keyId: null as string | null, mods: [] as string[] };
    const m = CHARMAP[nextChar];
    if (!m) return { keyId: null, mods: [] };
    const mods: string[] = [];
    const keyDef = KEY_BY_ID[m.key];
    if (m.shift && keyDef) {
      mods.push(keyDef.finger <= 3 ? "ShiftR" : "ShiftL");
    }
    if (m.altgr) mods.push("AltGr");
    if (m.dead) {
      mods.push(m.dead);
      // La diéresis lleva shift en la tecla muerta, que está en la mano derecha.
      if (m.deadShift) mods.push("ShiftL");
    }
    return { keyId: m.key, mods };
  }, [nextChar]);

  const fingerHint = useMemo(() => {
    if (!nextChar || !guide) return "";
    const m = CHARMAP[nextChar];
    if (!m) return "";
    const keyDef = KEY_BY_ID[m.key];
    if (!keyDef) return "";
    const parts: string[] = [];
    if (m.dead) parts.push(m.deadShift ? "primero shift + ´ (meñique derecho), después" : "primero ´ (meñique derecho), después");
    parts.push(FINGER_NAMES[keyDef.finger]);
    if (m.shift) {
      const shiftId = keyDef.finger <= 3 ? "ShiftR" : "ShiftL";
      parts.push(`+ shift (${shiftId === "ShiftR" ? "meñique derecho" : "meñique izquierdo"})`);
    }
    if (m.altgr) parts.push("+ alt gr (pulgar derecho)");
    return parts.join(" ");
  }, [nextChar, guide]);

  return (
    <div>
      <div className="finger-hint">{fingerHint || " "}</div>
      <div className={"keyboard" + (guide ? " guide" : "")}>
        {KB_ROWS.map((row, ri) => (
          <div className="krow" key={ri}>
            {row.map((k) => {
              const isNext = highlight.keyId === k.id;
              const isMod = highlight.mods.includes(k.id);
              const isPressed = pressedKey === k.id;
              const fingerVarIdx = k.finger === 8 ? "fthumb" : `f${k.finger}`;
              const valorCalor = calor ? calor[k.id] : undefined;
              const style: Record<string, string> = { "--fkey": `var(--${fingerVarIdx})` };
              if (calor && valorCalor !== undefined) style["--calor"] = String(valorCalor);
              return (
                <div
                  key={k.id}
                  className={
                    "key" +
                    (k.cls ? ` ${k.cls}` : "") +
                    (isNext ? " next" : "") +
                    (isMod ? " next-mod" : "") +
                    (isPressed ? " pressed" : "") +
                    (calor && valorCalor !== undefined ? " calor" : "") +
                    (calor && valorCalor === undefined ? " sin-datos" : "")
                  }
                  style={style}
                >
                  {k.shift && <span className="sub">{k.shift}</span>}
                  {k.altgr && <span className="sub2">{k.altgr}</span>}
                  <span>{k.base}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
