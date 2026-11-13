// PRNG determinista para reproducir un texto exacto a partir de su semilla.
// Copiado de ../Shellpath/app/src/lib/speed.ts (solo mulberry32 y newSeed).

/** PRNG determinista (mulberry32). Rápido, sin dependencias, suficiente para
 * barajar de forma reproducible a partir de un entero. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semilla nueva aleatoria (entero de 32 bits sin signo). */
export function newSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/** Baraja Fisher-Yates una copia del array con el rng dado. No muta el original
 * ni usa Math.random, así que es totalmente reproducible. */
export function barajado<T>(arr: readonly T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Identificador único (UUID v4). `crypto.randomUUID` solo existe en contextos seguros (HTTPS o localhost);
 * con la app servida por HTTP en la LAN no está, pero `getRandomValues` sí. */
export function nuevoId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
