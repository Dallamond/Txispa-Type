import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Ajustes, Intento } from "../types";
import { MotorCodigo } from "../lib/motorCodigo";
import { tokenizar } from "../lib/curso";
import { crearIntentoLeccion } from "../lib/intento";
import { precision, wpmNeta } from "../lib/medidas";
import { formatoReloj } from "../lib/historial";
import { esAtajo, isModifier, modifierLabel, pressedKeyFor } from "../lib/typing";
import { usePressedKey } from "../hooks/usePressedKey";
import { useContadorTecleo } from "../hooks/ContadorTecleo";
import AreaCodigo from "./AreaCodigo";
import ResultadoLeccion from "./ResultadoLeccion";
import VirtualKeyboard from "./VirtualKeyboard";

interface Props {
  /** Código de la lección, tal cual (con "\n" y sangría). */
  codigo: string;
  /** "html/L01.01". */
  leccionId: string;
  titulo: string;
  ajustes: Ajustes;
  onGuardar: (intento: Intento) => Promise<void> | void;
  onSalir: () => void;
  onRepetir: () => void;
}

/** Una lección tecleada de principio a fin. Sin cuenta atrás: el reloj cuenta hacia arriba
 * desde la primera pulsación y la lección termina al dejar el código bien escrito.
 * El padre la remonta (con `key`) para repetir. */
export default function TecleoCodigo({ codigo, leccionId, titulo, ajustes, onGuardar, onSalir, onRepetir }: Props) {
  const [motor] = useState(() => new MotorCodigo(tokenizar(codigo), ajustes.estrictoPorDefecto));
  const [, repinta] = useReducer((n: number) => n + 1, 0);
  const [resultado, setResultado] = useState<Intento | null>(null);
  const [pressedKey, setPressedKey] = usePressedKey();
  const terminadoRef = useRef(false);
  const alGuardarRef = useRef(onGuardar);
  alGuardarRef.current = onGuardar;
  const contador = useContadorTecleo();

  const terminar = useCallback(
    (ts: number) => {
      if (terminadoRef.current) return;
      terminadoRef.current = true;
      const intento = crearIntentoLeccion({ motor, ts, leccionId, estricto: motor.estricto, id: crypto.randomUUID(), fecha: new Date() });
      setResultado(intento);
      void alGuardarRef.current(intento);
    },
    [motor, leccionId]
  );

  // Reloj en vivo: no corre hasta la primera pulsación.
  useEffect(() => {
    if (resultado) return;
    const id = setInterval(() => {
      if (motor.inicio === null) return;
      repinta();
      contador.reportarTiempo((performance.now() - motor.inicio) / 1000);
    }, 250);
    return () => clearInterval(id);
  }, [motor, resultado, contador]);

  useEffect(() => {
    if (resultado) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        terminadoRef.current = true;
        // Lección abandonada: no se guarda, pero el tiempo vivido sí cuenta como tiempo del día.
        contador.descartar(motor.inicio !== null ? (performance.now() - motor.inicio) / 1000 : 0);
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
      // Todo lo demás se come: sin preventDefault, Enter o espacio activarían el botón con el foco.
      e.preventDefault();
      if (e.key !== "Backspace" && e.key !== "Enter" && e.key.length !== 1) return;
      if (motor.tecla(e.key, e.timeStamp) === "ignorada") return;
      setPressedKey(e.key === "Backspace" ? "Backspace" : e.key === "Enter" ? "Enter" : pressedKeyFor(e.key));
      repinta();
      contador.reportar(motor.correct + motor.errors);
      if (motor.agotado) terminar(e.timeStamp);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [motor, resultado, terminar, onSalir, setPressedKey, contador]);

  // Si se cambia de pestaña a mitad de una lección, el tiempo vivido se guarda como tiempo del día.
  useEffect(
    () => () => {
      if (!terminadoRef.current) contador.descartar(motor.inicio !== null ? (performance.now() - motor.inicio) / 1000 : 0);
    },
    [contador, motor]
  );

  // Enter repite una vez mostrado el resultado.
  useEffect(() => {
    if (!resultado) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onRepetir();
      }
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [resultado, onRepetir]);

  if (resultado) return <ResultadoLeccion intento={resultado} titulo={titulo} onRepetir={onRepetir} onSalir={onSalir} />;

  const el = motor.inicio === null ? 0 : (performance.now() - motor.inicio) / 1000;
  const wpmVivo = el > 1 ? wpmNeta(motor.correct, el) : 0;
  const hechos = Math.min(motor.idx, motor.tokens.length);

  return (
    <section>
      <div className="tecleo-cabecera">
        <span className="tenue">{titulo}</span>
        <div className="cronometro-num mono" role="timer" aria-label="Tiempo transcurrido">
          {formatoReloj(el)}
        </div>
        <div className="metricas-vivo" aria-live="off">
          <span>
            ppm <b>{Math.round(wpmVivo)}</b>
          </span>
          <span>
            precisión <b>{Math.round(precision(motor.correct, motor.errors))}%</b>
          </span>
        </div>
      </div>
      <div className="cronometro-barra">
        <div className="cronometro-relleno" style={{ width: `${(hechos / motor.tokens.length) * 100}%` }} />
      </div>
      {motor.inicio === null && <div className="tenue cronometro-pista">Empieza a teclear para arrancar el reloj</div>}

      <AreaCodigo tokens={motor.tokens} tecleadas={motor.tecleadas} idx={motor.idx} />

      {ajustes.tecladoVisible && (
        <VirtualKeyboard nextChar={motor.siguienteCaracter} pressedKey={pressedKey} guide={ajustes.guiaDedos} />
      )}
      <p className="pista-esc tenue">
        <kbd>Esc</kbd> salir · <kbd>Enter</kbd> cierra cada línea y el <kbd>espacio</kbd> cada palabra · la sangría la pone la app
      </p>
    </section>
  );
}
