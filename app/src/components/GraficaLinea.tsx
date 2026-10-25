import { dominioY, indicesEjeX } from "../lib/grafica";
import { formatoNumero, mediaMovil } from "../lib/historial";

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
}

const W = 640;
const H = 220;
const M = { t: 12, r: 14, b: 26, l: 40 };

export default function GraficaLinea({ valores, etiquetas, metrica, titulo, unidad, umbralBajo }: Props) {
  const n = valores.length;
  if (n === 0) return <p className="tenue">Sin datos para esta gráfica.</p>;

  const { lo, hi } = dominioY(valores, metrica);
  const anchoUtil = W - M.l - M.r;
  const altoUtil = H - M.t - M.b;
  const x = (i: number) => (n === 1 ? M.l + anchoUtil / 2 : M.l + (i / (n - 1)) * anchoUtil);
  const y = (v: number) => M.t + (1 - (v - lo) / (hi - lo)) * altoUtil;

  const paso = (hi - lo) / 4;
  const ticks = [0, 1, 2, 3, 4].map((k) => lo + paso * k);
  const movil = mediaMovil(valores, 5);
  const linea = (vs: readonly number[]) => vs.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  const ultimo = valores[n - 1];
  const resumen = `${titulo}: ${n} ${n === 1 ? "test" : "tests"}, último ${formatoNumero(ultimo)} ${unidad}, mínimo ${formatoNumero(
    Math.min(...valores)
  )}, máximo ${formatoNumero(Math.max(...valores))}.`;

  return (
    <svg className="grafica" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={resumen} preserveAspectRatio="xMidYMid meet">
      <title>{resumen}</title>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className="grafica-rejilla" />
          <text x={M.l - 6} y={y(t) + 4} textAnchor="end" className="grafica-texto">
            {formatoNumero(t, Number.isInteger(paso) ? 0 : 1)}
          </text>
        </g>
      ))}
      {indicesEjeX(n).map((i) => (
        <text key={i} x={x(i)} y={H - 7} textAnchor="middle" className="grafica-texto">
          {etiquetas[i]}
        </text>
      ))}
      {n > 1 && <path d={linea(valores)} className="grafica-serie" />}
      {n > 1 && <path d={linea(movil)} className="grafica-movil" />}
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
  );
}
