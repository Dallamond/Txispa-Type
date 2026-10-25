import { useEffect, useState } from "react";

/** Gestiona el "pulso" visual de la última tecla pulsada: se pone al pulsar y
 * se limpia solo tras `ms`. Extraído de Practice/BossBattle para no duplicarlo. */
export function usePressedKey(ms = 130) {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!pressedKey) return;
    const t = setTimeout(() => setPressedKey(null), ms);
    return () => clearTimeout(t);
  }, [pressedKey, ms]);

  return [pressedKey, setPressedKey] as const;
}
