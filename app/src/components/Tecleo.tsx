import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Ajustes, Intento } from "../types";
import { MotorTecleo } from "../lib/motor";
import { esAtajo, isModifier, modifierLabel, pressedKeyFor } from "../lib/typing";
import { usePressedKey } from "../hooks/usePressedKey";
import { usePulso } from "../hooks/usePulso";
import { desviacionAlPulso, desviacionMedia, limitarPulso } from "../lib/metronomo";
import { crearIntento, type ConfigIntento } from "../lib/intento";
import { precision, wpmNeta } from "../lib/medidas";
import { posicionFantasma } from "../lib/calentamientos";
import { nuevoId } from "../lib/rng";
import { AVISO_GUARDADO, guardarIntento } from "../lib/guardado";
import { useContadorTecleo } from "../hooks/ContadorTecleo";
import AreaTexto from "./AreaTexto";
import ResultadoTest from "./ResultadoTest";
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

/** Segundos restantes como m:ss. */
const formatoReloj = (s: number) => {
  const t = Math.ceil(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

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
  const [errorGuardado, setErrorGuardado] = useState(false);
  const alGuardarRef = useRef(onGuardar);
  alGuardarRef.current = onGuardar;
  const contador = useContadorTecleo();
  const alTerminarRef = useRef(onTerminar);
  alTerminarRef.current = onTerminar;

  const terminar = useCallback(
    (ts: number) => {
      if (terminadoRef.current) return;
      terminadoRef.current = true;
      const intento = crearIntento({ motor, ts, config, id: nuevoId(), fecha: new Date() });
      setResultado(intento);
      const desviacionMs = desviacionMedia(desviosRef.current);
      setDesviacionFinal(desviacionMs);
      alTerminarRef.current?.(intento, { desviacionMs });
      if (guardar && motor.correct + motor.errors > 0) {
        void guardarIntento(alGuardarRef.current, intento).then((ok) => {
          if (!ok) setErrorGuardado(true);
        });
      }
      // Lo guardado entra en el total cuando aparece en el almacén; un calentamiento no se guarda y se suma aparte.
      if (!guardar) contador.confirmar(motor.correct + motor.errors);
    },
    [motor, config, guardar, contador]
  );

  // Cuenta atrás: no corre hasta la primera pulsación, así leer el texto antes no penaliza.
  useEffect(() => {
    if (resultado) return;
    const id = setInterval(() => {
      if (motor.inicio === null) return;
      const ahora = performance.now();
      if ((ahora - motor.inicio) / 1000 >= config.durationSec) terminar(motor.inicio + config.durationSec * 1000);
      else {
        repinta();
        if (guardar) contador.reportarTiempo((ahora - motor.inicio) / 1000);
      }
    }, 100);
    return () => clearInterval(id);
  }, [motor, config.durationSec, resultado, terminar, guardar, contador]);

  useEffect(() => {
    if (resultado) return;
    const conPulso = pulso !== null;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        terminadoRef.current = true;
        if (guardar) {
          // Test o entreno abandonado: lo tecleado no se guarda, pero el tiempo vivido sí cuenta.
          contador.descartar(motor.inicio !== null ? (performance.now() - motor.inicio) / 1000 : 0);
        } else {
          contador.confirmar(motor.correct + motor.errors);
        }
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
      contador.reportar(motor.correct + motor.errors);
      if (motor.agotado) terminar(e.timeStamp);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [motor, resultado, terminar, onSalir, setPressedKey, pulso, rejilla, guardar, contador]);

  // Si se cambia de pestaña a mitad de una prueba, lo tecleado sin guardar deja de contar en vivo,
  // pero el tiempo vivido de un test o entreno se guarda como tiempo del día.
  useEffect(
    () => () => {
      if (!terminadoRef.current)
        contador.descartar(guardar && motor.inicio !== null ? (performance.now() - motor.inicio) / 1000 : 0);
    },
    [contador, guardar, motor]
  );

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
      <>
        {errorGuardado && (
          <p className="aviso" role="alert">
            {AVISO_GUARDADO}
          </p>
        )}
        <ResultadoTest
          intento={resultado}
          objetivoTests={ajustes.objetivoTests}
          etiqueta={etiqueta}
          intentos={intentos}
          comparar={guardar && resultado.modo === "test"}
          desviacionMs={pulso !== null ? desviacionFinal : undefined}
          onRepetir={onRepetir}
          onSalir={onSalir}
        />
      </>
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
        <div className="cronometro-num mono" role="timer" aria-label="Tiempo restante">
          {formatoReloj(restante)}
        </div>
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
      <div className="cronometro-barra">
        <div className="cronometro-relleno" style={{ width: `${(el / config.durationSec) * 100}%` }} />
      </div>
      {motor.inicio === null && <div className="tenue cronometro-pista">Empieza a teclear para arrancar el reloj</div>}

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
