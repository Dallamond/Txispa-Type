import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Ajustes, Intento } from "../types";
import { MotorTecleo } from "../lib/motor";
import { esAtajo, isModifier, modifierLabel, pressedKeyFor } from "../lib/typing";
import { usePressedKey } from "../hooks/usePressedKey";
import { usePulso } from "../hooks/usePulso";
import { desviacionAlPulso, desviacionMedia, limitarPulso } from "../lib/metronomo";
import {
  confusionesMasRepetidas,
  crearIntento,
  teclasMasFalladas,
  type ConfigIntento,
} from "../lib/intento";
import { mediaUltimos } from "../lib/estadisticas";
import { PRECISION_MINIMA, precision, wpmNeta } from "../lib/medidas";
import { posicionFantasma } from "../lib/calentamientos";
import AreaTexto from "./AreaTexto";
import VirtualKeyboard from "./VirtualKeyboard";

interface Props {
  palabras: readonly string[];
  config: ConfigIntento;
  ajustes: Ajustes;
  /** Historial para comparar el resultado con los últimos 10 tests. */
  intentos: readonly Intento[];
  /** Si es false (calentamientos) no se guarda ni se compara. */
  guardar: boolean;
  etiqueta: string;
  onGuardar: (intento: Intento) => Promise<void> | void;
  onSalir: () => void;
  onRepetir: () => void;
  /** Wpm al que avanza el cursor fantasma (calentamientos). */
  fantasmaWpm?: number | null;
  /** Si se da, al terminar se avisa por aquí y no se muestra la pantalla de resultado. */
  onTerminar?: (intento: Intento, extra: { desviacionMs: number | null }) => void;
  /** Pulso inicial (wpm) del metrónomo; si se da, suena y se mide la desviación. */
  pulsoWpm?: number | null;
}

const fmt = (n: number, d = 1) => n.toFixed(d).replace(".", ",");

/** Una prueba completa: texto, cronómetro, métricas en vivo y resultado.
 * El padre la remonta (con `key`) para repetir con otro texto. */
export default function Tecleo({ palabras, config, ajustes, intentos, guardar, etiqueta, onGuardar, onSalir, onRepetir, fantasmaWpm, onTerminar, pulsoWpm }: Props) {
  const [motor] = useState(() => new MotorTecleo(palabras, config.estricto));
  const [, repinta] = useReducer((n: number) => n + 1, 0);
  const [resultado, setResultado] = useState<Intento | null>(null);
  const [pressedKey, setPressedKey] = usePressedKey();
  const terminadoRef = useRef(false);
  const [pulso, setPulso] = useState<number | null>(pulsoWpm ?? null);
  const { destello, rejilla } = usePulso(pulso, !resultado);
  const desviosRef = useRef<number[]>([]);
  const [desviacionFinal, setDesviacionFinal] = useState<number | null>(null);
  const alGuardarRef = useRef(onGuardar);
  alGuardarRef.current = onGuardar;
  const alTerminarRef = useRef(onTerminar);
  alTerminarRef.current = onTerminar;

  const terminar = useCallback(
    (ts: number) => {
      if (terminadoRef.current) return;
      terminadoRef.current = true;
      const intento = crearIntento({ motor, ts, config, id: crypto.randomUUID(), fecha: new Date() });
      setResultado(intento);
      const desviacionMs = desviacionMedia(desviosRef.current);
      setDesviacionFinal(desviacionMs);
      alTerminarRef.current?.(intento, { desviacionMs });
      if (guardar && motor.correct + motor.errors > 0) void alGuardarRef.current(intento);
    },
    [motor, config, guardar]
  );

  // Cuenta atrás: no corre hasta la primera pulsación, así leer el texto antes no penaliza.
  useEffect(() => {
    if (resultado) return;
    const id = setInterval(() => {
      if (motor.inicio === null) return;
      const ahora = performance.now();
      if ((ahora - motor.inicio) / 1000 >= config.durationSec) terminar(motor.inicio + config.durationSec * 1000);
      else repinta();
    }, 100);
    return () => clearInterval(id);
  }, [motor, config.durationSec, resultado, terminar]);

  useEffect(() => {
    if (resultado) return;
    const conPulso = pulso !== null;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        terminadoRef.current = true;
        onSalir();
        return;
      }
      if (esAtajo(e)) return; // Ctrl+R, Ctrl+V… no son pulsaciones
      if (isModifier(e.key)) {
        const lbl = modifierLabel(e.key);
        if (lbl) setPressedKey(lbl);
        return;
      }
      // La tecla muerta (´) debe llegar al sistema para componer á, é…
      if (e.key === "Dead") return;
      // Enter y demás hay que comérselos: sin preventDefault activarían el botón con el foco.
      e.preventDefault();
      if (e.key !== "Backspace" && e.key.length !== 1) return;
      const r = motor.tecla(e.key, e.timeStamp);
      if (r === "ignorada") return;
      if (conPulso && (r === "ok" || r === "cierra" || r === "cierraConFaltas")) {
        desviosRef.current.push(desviacionAlPulso(e.timeStamp, rejilla.current.t0, rejilla.current.periodo));
      }
      setPressedKey(e.key === "Backspace" ? "Backspace" : pressedKeyFor(e.key));
      repinta();
      if (motor.agotado) terminar(e.timeStamp);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [motor, resultado, terminar, onSalir, setPressedKey, pulso, rejilla]);

  // Enter repite una vez mostrado el resultado.
  useEffect(() => {
    if (!resultado || onTerminar) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onRepetir();
      }
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [resultado, onRepetir, onTerminar]);

  if (resultado) {
    if (onTerminar) return null;
    return (
      <Resultado
        intento={resultado}
        etiqueta={etiqueta}
        intentos={intentos}
        comparar={guardar && resultado.modo === "test"}
        desviacionMs={pulso !== null ? desviacionFinal : undefined}
        onRepetir={onRepetir}
        onSalir={onSalir}
      />
    );
  }

  const ahora = performance.now();
  const el = motor.inicio === null ? 0 : Math.min(config.durationSec, (ahora - motor.inicio) / 1000);
  const restante = Math.max(0, config.durationSec - el);
  const wpmVivo = el > 1 ? wpmNeta(motor.correct, el) : 0;
  const accViva = precision(motor.correct, motor.errors);
  const desvioVivo = pulso !== null ? desviacionMedia(desviosRef.current) : null;

  return (
    <section>
      <div className="tecleo-cabecera">
        <span className="tenue">{etiqueta}</span>
        <div className="metricas-vivo" aria-live="off">
          <span>
            ppm <b>{Math.round(wpmVivo)}</b>
          </span>
          <span>
            precisión <b>{Math.round(accViva)}%</b>
          </span>
          {pulso !== null && (
            <span>
              desviación <b>{desvioVivo === null ? "—" : `${Math.round(desvioVivo)} ms`}</b>
            </span>
          )}
        </div>
      </div>

      <div className="cronometro">
        <div className="cronometro-num mono">{Math.ceil(restante)}</div>
        <div className="cronometro-barra">
          <div className="cronometro-relleno" style={{ width: `${(el / config.durationSec) * 100}%` }} />
        </div>
        {motor.inicio === null && <div className="tenue">Empieza a teclear para arrancar el reloj</div>}
      </div>

      {pulso !== null && (
        <div className="pulso-control" role="group" aria-label="Pulso del metrónomo">
          <span className={`pulso-luz${destello ? " on" : ""}`} aria-hidden="true" />
          <button type="button" className="btn" onClick={() => setPulso((p) => limitarPulso((p ?? 40) - 2))} aria-label="Bajar el pulso">
            −
          </button>
          <span className="mono">{pulso} ppm</span>
          <button type="button" className="btn" onClick={() => setPulso((p) => limitarPulso((p ?? 40) + 2))} aria-label="Subir el pulso">
            +
          </button>
        </div>
      )}

      <AreaTexto
        palabras={motor.palabras}
        tecleadas={motor.tecleadas}
        idx={motor.idx}
        fantasma={fantasmaWpm && motor.inicio !== null ? posicionFantasma(fantasmaWpm, el) : undefined}
      />

      {ajustes.tecladoVisible && (
        <VirtualKeyboard nextChar={motor.siguienteCaracter} pressedKey={pressedKey} guide={ajustes.guiaDedos} />
      )}
      <p className="pista-esc tenue">
        <kbd>Esc</kbd> cancelar · el <kbd>espacio</kbd> cierra cada palabra y no se puede volver atrás
      </p>
    </section>
  );
}

function Resultado({
  intento,
  etiqueta,
  intentos,
  comparar,
  desviacionMs,
  onRepetir,
  onSalir,
}: {
  intento: Intento;
  etiqueta: string;
  intentos: readonly Intento[];
  comparar: boolean;
  /** Desviación media al pulso del metrónomo (ms); undefined si no hubo metrónomo. */
  desviacionMs?: number | null;
  onRepetir: () => void;
  onSalir: () => void;
}) {
  const previos = comparar ? mediaUltimos([...intentos], 10, intento.id) : null;
  const dW = previos ? intento.wpm - previos.wpm : null;
  const dA = previos ? intento.acc - previos.acc : null;
  const falladas = teclasMasFalladas(intento.teclas);
  const confusiones = confusionesMasRepetidas(intento.confusiones, 3);
  const vacio = intento.correct + intento.errors === 0;

  return (
    <section className="tarjeta resultado">
      <h1>{etiqueta} · resultado</h1>

      {vacio ? (
        <p className="tenue">No se tecleó nada.</p>
      ) : (
        <>
          <div className="resultado-cifras">
            <Cifra valor={fmt(intento.wpm)} etiqueta="ppm netas" delta={dW} />
            <Cifra valor={`${fmt(intento.acc)}%`} etiqueta="precisión" delta={dA} sufijo="%" />
            <Cifra valor={fmt(intento.rawWpm)} etiqueta="ppm brutas" />
            <Cifra valor={intento.consistency === null ? "—" : `${Math.round(intento.consistency)}%`} etiqueta="ritmo constante" />
            <Cifra valor={String(intento.errors)} etiqueta="errores" />
            {desviacionMs !== undefined && (
              <Cifra valor={desviacionMs === null ? "—" : `${Math.round(desviacionMs)} ms`} etiqueta="desviación al pulso" />
            )}
          </div>

          {intento.acc < PRECISION_MINIMA && (
            <p className="aviso-precision">
              Precisión por debajo del {PRECISION_MINIMA}%: esta velocidad no cuenta como progreso. Baja un poco el ritmo.
            </p>
          )}
          {previos ? (
            <p className="tenue">Comparado con la media de tus últimos {previos.n} tests ({fmt(previos.wpm)} ppm, {fmt(previos.acc)}%).</p>
          ) : (
            comparar && <p className="tenue">Es tu primer test: aún no hay con qué comparar.</p>
          )}

          <h2>Teclas con más fallos en este test</h2>
          {falladas.length === 0 ? (
            <p className="tenue">Ninguna. Test limpio.</p>
          ) : (
            <div className="fichas">
              {falladas.map((t) => (
                <span key={t.tecla} className="ficha mono">
                  {t.tecla} ×{t.errores}
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
        </>
      )}

      <div className="acciones">
        <button type="button" className="btn primario" onClick={onRepetir} autoFocus>
          Repetir <kbd>⏎</kbd>
        </button>
        <button type="button" className="btn" onClick={onSalir}>
          Volver
        </button>
      </div>
    </section>
  );
}

function Cifra({ valor, etiqueta, delta, sufijo = "" }: { valor: string; etiqueta: string; delta?: number | null; sufijo?: string }) {
  return (
    <div className="cifra">
      <div className="cifra-valor">{valor}</div>
      <div className="cifra-etiqueta">{etiqueta}</div>
      {delta !== undefined && delta !== null && (
        <div className={`cifra-delta ${delta >= 0 ? "sube" : "baja"}`}>
          {delta >= 0 ? "+" : "−"}
          {fmt(Math.abs(delta))}
          {sufijo}
        </div>
      )}
    </div>
  );
}
