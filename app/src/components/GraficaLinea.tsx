import { useEffect, useId, useRef, useState } from "react";
import { dominioY, indicesEjeX } from "../lib/grafica";
import { formatoNumero, mediaMovil, ticksRedondos } from "../lib/historial";

interface Props {
  /** Valores de más antiguo a más reciente. */
  valores: readonly number[];
  /** Etiqueta del eje X de cada valor (misma longitud que `valores`). */
  etiquetas: readonly string[];
  metrica: "wpm" | "acc";
  /** Título accesible, p. ej. "Velocidad neta". */
  titulo: string;
  unidad: string;
  /** Los puntos por debajo de este valor se pintan con el color de aviso. */
  umbralBajo?: number;
  /** Índice del punto a resaltar (p. ej. el test que acabas de hacer). */
  destacar?: number;
}

const M = { t: 16, r: 14, b: 26, l: 40 };

/** Ancho del SVG = ancho real de su caja, para que el texto salga siempre a tamaño natural. */
function useAncho(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const medir = () => setAncho(Math.max(260, Math.round(el.clientWidth)));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, ancho];
}

export default function GraficaLinea({ valores, etiquetas, metrica, titulo, unidad, umbralBajo, destacar }: Props) {
  const [caja, W] = useAncho();
  const idDegradado = useId();
  const H = Math.min(300, Math.max(200, Math.round(W * 0.55)));
  const n = valores.length;
  if (n === 0) return <p className="tenue">Sin datos para esta gráfica.</p>;

  const { lo, hi } = dominioY(valores, metrica);
  const anchoUtil = W - M.l - M.r;
  const altoUtil = H - M.t - M.b;
  const x = (i: number) => (n === 1 ? M.l + anchoUtil / 2 : M.l + (i / (n - 1)) * anchoUtil);
  const y = (v: number) => M.t + (1 - (v - lo) / (hi - lo)) * altoUtil;

  const ticks = ticksRedondos(lo, hi);
  const decimalesTick = ticks.every(Number.isInteger) ? 0 : 1;
  const movil = mediaMovil(valores, 5);
  const linea = (vs: readonly number[]) => vs.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  const ultimo = valores[n - 1];
  const resumen = `${titulo}: ${n} ${n === 1 ? "test" : "tests"}, último ${formatoNumero(ultimo)} ${unidad}, mínimo ${formatoNumero(
    Math.min(...valores)
  )}, máximo ${formatoNumero(Math.max(...valores))}.`;

  return (
    <div ref={caja} className="grafica-contenedor">
    <svg className="grafica" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={resumen} preserveAspectRatio="xMidYMid meet">
      <title>{resumen}</title>
      <defs>
        <linearGradient id={idDegradado} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className="grafica-rejilla" />
          <text x={M.l - 6} y={y(t) + 4} textAnchor="end" className="grafica-texto">
            {formatoNumero(t, decimalesTick)}
          </text>
        </g>
      ))}
      {indicesEjeX(n).map((i) => (
        <text key={i} x={x(i)} y={H - 7} textAnchor="middle" className="grafica-texto">
          {etiquetas[i]}
        </text>
      ))}
      {n > 1 && <path d={`${linea(movil)} L${x(n - 1).toFixed(1)} ${(H - M.b).toFixed(1)} L${x(0).toFixed(1)} ${(H - M.b).toFixed(1)} Z`} className="grafica-area" fill={`url(#${idDegradado})`} />}
      {n > 1 && <path d={linea(valores)} className="grafica-serie" />}
      {n > 1 && <path d={linea(movil)} className="grafica-movil" />}
      {destacar === undefined && n > 1 && (
        <text x={x(n - 1)} y={y(ultimo) - 10 < M.t + 6 ? y(ultimo) + 18 : y(ultimo) - 10} textAnchor="end" className="grafica-etiqueta-final" aria-hidden="true">
          {formatoNumero(ultimo)}
        </text>
      )}
      {destacar !== undefined && destacar >= 0 && destacar < n && (
        <g aria-hidden="true">
          <line x1={x(destacar)} x2={x(destacar)} y1={M.t} y2={H - M.b} className="grafica-guia" />
          <circle cx={x(destacar)} cy={y(valores[destacar])} r={7} className="grafica-actual" />
        </g>
      )}
      {valores.map((v, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(v)}
          r={3}
          className={umbralBajo !== undefined && v < umbralBajo ? "grafica-punto bajo" : "grafica-punto"}
        >
          <title>{`${etiquetas[i]}: ${formatoNumero(v)} ${unidad}`}</title>
        </circle>
      ))}
    </svg>
    </div>
  );
}
