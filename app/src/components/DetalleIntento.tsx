import type { Intento } from "../types";
import { confusionesMasRepetidas, teclasMasFalladas } from "../lib/intento";
import { etiquetaFuente, formatoNumero, formatoTiempo, mediaPrevia } from "../lib/historial";
import { PRECISION_MINIMA } from "../lib/medidas";

interface Props {
  intento: Intento;
  /** Todos los intentos, para comparar con los 10 tests anteriores a este. */
  intentos: readonly Intento[];
}

function Delta({ valor, sufijo = "" }: { valor: number | null; sufijo?: string }) {
  if (valor === null) return null;
  return (
    <div className={`cifra-delta ${valor >= 0 ? "sube" : "baja"}`}>
      {valor >= 0 ? "+" : "−"}
      {formatoNumero(Math.abs(valor))}
      {sufijo}
    </div>
  );
}

/** Detalle de un intento del historial: lo mismo que se vio al terminarlo. */
export default function DetalleIntento({ intento: t, intentos }: Props) {
  const previos = t.modo === "test" ? mediaPrevia(intentos, t) : null;
  const falladas = teclasMasFalladas(t.teclas);
  const confusiones = confusionesMasRepetidas(t.confusiones, 5);

  return (
    <div className="detalle-intento">
      <div className="resultado-cifras">
        <div className="cifra">
          <div className="cifra-valor">{formatoNumero(t.wpm)}</div>
          <div className="cifra-etiqueta">ppm netas</div>
          <Delta valor={previos ? t.wpm - previos.wpm : null} />
        </div>
        <div className="cifra">
          <div className="cifra-valor">{formatoNumero(t.acc)}%</div>
          <div className="cifra-etiqueta">precisión</div>
          <Delta valor={previos ? t.acc - previos.acc : null} sufijo="%" />
        </div>
        <div className="cifra">
          <div className="cifra-valor">{formatoNumero(t.rawWpm)}</div>
          <div className="cifra-etiqueta">ppm brutas</div>
        </div>
        <div className="cifra">
          <div className="cifra-valor">{t.consistency === null ? "—" : `${Math.round(t.consistency)}%`}</div>
          <div className="cifra-etiqueta">ritmo constante</div>
        </div>
        <div className="cifra">
          <div className="cifra-valor">{t.errors}</div>
          <div className="cifra-etiqueta">errores</div>
        </div>
        <div className="cifra">
          <div className="cifra-valor">{(t.correct + t.errors).toLocaleString("es-ES")}</div>
          <div className="cifra-etiqueta">pulsaciones</div>
        </div>
      </div>

      <p className="tenue">
        {etiquetaFuente(t.fuente, t.ejercicioId)} · {formatoTiempo(t.elapsedSec)} tecleando
        {t.estricto ? " · modo estricto" : ""}
        {previos && ` · comparado con ${previos.n === 1 ? "el test anterior" : `la media de los ${previos.n} tests anteriores`} (${formatoNumero(previos.wpm)} ppm, ${formatoNumero(previos.acc)} %)`}
      </p>
      {t.acc < PRECISION_MINIMA && (
        <p className="aviso-precision">Precisión por debajo del {PRECISION_MINIMA}%: esta velocidad no cuenta como progreso.</p>
      )}

      <h2>Teclas con más fallos</h2>
      {falladas.length === 0 ? (
        <p className="tenue">Ninguna. Test limpio.</p>
      ) : (
        <div className="fichas">
          {falladas.map((f) => (
            <span key={f.tecla} className="ficha mono">
              {f.tecla} ×{f.errores}
            </span>
          ))}
        </div>
      )}

      {confusiones.length > 0 && (
        <>
          <h2>Confusiones</h2>
          <div className="fichas">
            {confusiones.map((c) => (
              <span key={`${c.esperada}>${c.escrita}`} className="ficha mono">
                {c.esperada} → {c.escrita} ×{c.veces}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
