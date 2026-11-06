import type { Intento } from "../types";
import { PRECISION_MINIMA } from "../lib/medidas";
import { formatoReloj } from "../lib/historial";

interface Props {
  intento: Intento;
  titulo: string;
  onRepetir: () => void;
  onSalir: () => void;
}

/** Resultado de una lección: velocidad y precisión siempre juntas (regla del proyecto). */
export default function ResultadoLeccion({ intento, titulo, onRepetir, onSalir }: Props) {
  const superada = intento.acc >= PRECISION_MINIMA;
  return (
    <section className="tarjeta cur-resultado" aria-live="polite">
      <p className="tenue">{titulo}</p>
      <h1>{superada ? "Lección superada" : "Casi: repítela con más precisión"}</h1>
      <p className="tenue">
        {superada
          ? `Has llegado al ${PRECISION_MINIMA} % de precisión que pide la lección.`
          : `Para darla por hecha hace falta un ${PRECISION_MINIMA} % de precisión.`}
      </p>
      <div className="cur-cifras">
        <div>
          <b>{Math.round(intento.wpm)}</b>
          <span>ppm</span>
        </div>
        <div className={superada ? "ok" : "mal"}>
          <b>{Math.round(intento.acc)}%</b>
          <span>precisión</span>
        </div>
        <div>
          <b>{intento.errors}</b>
          <span>errores</span>
        </div>
        <div>
          <b>{formatoReloj(intento.elapsedSec)}</b>
          <span>tiempo</span>
        </div>
      </div>
      <div className="cur-acciones">
        <button type="button" className="btn primario" onClick={onRepetir}>
          Repetir <kbd>Enter</kbd>
        </button>
        <button type="button" className="btn" onClick={onSalir}>
          Volver al curso
        </button>
      </div>
    </section>
  );
}
