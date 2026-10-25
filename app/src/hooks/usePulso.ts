import { useEffect, useRef, useState } from "react";
import { periodoMs } from "../lib/metronomo";

function pitido(ctx: AudioContext, cuando: number): void {
  const osc = ctx.createOscillator();
  const ganancia = ctx.createGain();
  osc.frequency.value = 880;
  ganancia.gain.setValueAtTime(0.0001, cuando);
  ganancia.gain.exponentialRampToValueAtTime(0.2, cuando + 0.004);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, cuando + 0.05);
  osc.connect(ganancia).connect(ctx.destination);
  osc.start(cuando);
  osc.stop(cuando + 0.06);
}

/** Pulso audible y visual a `wpm × 5 / 60` pulsaciones por segundo.
 * Devuelve la rejilla (`t0` y `periodo` en el reloj de `performance.now()`) para medir
 * la desviación, y `destello` para la luz. El sonido se programa en el reloj de
 * WebAudio con antelación, así no depende de la precisión de los temporizadores. */
export function usePulso(wpm: number | null, activo: boolean) {
  const rejilla = useRef({ t0: 0, periodo: 0 });
  const [destello, setDestello] = useState(false);

  useEffect(() => {
    if (wpm === null || !activo) return;
    const periodo = periodoMs(wpm);
    const t0 = performance.now();
    rejilla.current = { t0, periodo };
    let ctx: AudioContext | null = null;
    try {
      ctx = new AudioContext();
    } catch {
      ctx = null;
    }
    const desfase = ctx ? ctx.currentTime * 1000 - performance.now() : 0;
    const temporizadores = new Set<ReturnType<typeof setTimeout>>();
    let k = 1;
    const id = setInterval(() => {
      const ahora = performance.now();
      while (t0 + k * periodo < ahora + 150) {
        const cuando = t0 + k * periodo;
        if (ctx) pitido(ctx, (cuando + desfase) / 1000);
        const t = setTimeout(() => {
          setDestello(true);
          const apagar = setTimeout(() => setDestello(false), 90);
          temporizadores.add(apagar);
        }, Math.max(0, cuando - ahora));
        temporizadores.add(t);
        k++;
      }
    }, 25);
    return () => {
      clearInterval(id);
      temporizadores.forEach(clearTimeout);
      void ctx?.close();
    };
  }, [wpm, activo]);

  return { destello, rejilla };
}
