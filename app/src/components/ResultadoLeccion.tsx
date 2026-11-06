import type { Intento } from "../types";
import { formatoReloj } from "../lib/historial";
import { leccionSuperada, PRECISION_LECCION } from "../lib/curso";
import { confusionesMasRepetidas, teclasMasFalladas } from "../lib/intento";

interface Props {
  intento: Intento;
  titulo: string;
  onRepetir: () => void;
  onSalir: () => void;
  /** Si hay una lección después de esta, para abrirla desde aquí. */
  onSiguiente?: () => void;
}

/** Cómo se llama una tecla en pantalla (las claves de agregados usan ␣ y ⏎). */
const nombreTecla = (t: string) => (t === "␣" ? "Espacio" : t === "⏎" ? "Enter ⏎" : t);

/** Resultado de una lección: velocidad y precisión siempre juntas (regla del proyecto). */
export default function ResultadoLeccion({ intento, titulo, onRepetir, onSalir, onSiguiente }: Props) {
  const superada = leccionSuperada(intento);
  const falladas = teclasMasFalladas(intento.teclas, 5);
  const confusiones = confusionesMasRepetidas(intento.confusiones, 4);
  return (
    <section className="tarjeta cur-resultado" aria-live="polite">
      <p className="tenue">{titulo}</p>
      <h1>{superada ? "Lección superada" : "Casi: repítela con más precisión"}</h1>
      <p className="tenue">
        {superada
          ? `Has llegado al ${PRECISION_LECCION} % de precisión que pide la lección.`
          : `Para darla por hecha hace falta un ${PRECISION_LECCION} % de precisión.`}
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

      {falladas.length > 0 && (
        <div className="cur-fallos">
          <h2>Símbolos y teclas con fallos</h2>
          <ul>
            {falladas.map((f) => (
              <li key={f.tecla}>
                <kbd>{nombreTecla(f.tecla)}</kbd>
                <span>
                  {f.errores} {f.errores === 1 ? "fallo" : "fallos"} en {f.pulsaciones} {f.pulsaciones === 1 ? "pulsación" : "pulsaciones"}
                </span>
              </li>
            ))}
          </ul>
          {confusiones.length > 0 && (
            <p className="tenue">
              Confusiones:{" "}
              {confusiones.map((c, i) => (
                <span key={`${c.esperada}>${c.escrita}`}>
                  {i > 0 && " · "}
                  tocaba <kbd>{nombreTecla(c.esperada)}</kbd> y pulsaste <kbd>{nombreTecla(c.escrita)}</kbd>
                  {c.veces > 1 ? ` (${c.veces} veces)` : ""}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      <div className="cur-acciones">
        <button type="button" className={`btn${superada && onSiguiente ? "" : " primario"}`} onClick={onRepetir}>
          Repetir <kbd>Enter</kbd>
        </button>
        {onSiguiente && (
          <button type="button" className={`btn${superada ? " primario" : ""}`} onClick={onSiguiente}>
            Siguiente lección
          </button>
        )}
        <button type="button" className="btn" onClick={onSalir}>
          Volver al curso
        </button>
      </div>
    </section>
  );
}
