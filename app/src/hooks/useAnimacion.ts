import { useEffect, useState } from "react";

/** true si el sistema pide menos movimiento: las animaciones por JS se saltan. */
export const sinMovimiento = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Cuenta de 0 a `valor` con easing; sin animación si el usuario la ha desactivado. */
export function useCuenta(valor: number, ms = 1100): number {
  const [v, setV] = useState(() => (sinMovimiento() ? valor : 0));
  useEffect(() => {
    if (sinMovimiento()) {
      setV(valor);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const paso = (ahora: number) => {
      const p = Math.min(1, (ahora - t0) / ms);
      setV(valor * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor, ms]);
  return v;
}

/** true un instante después de montar: dispara las transiciones CSS de entrada. */
export function useEntrada(): boolean {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setListo(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return listo;
}
