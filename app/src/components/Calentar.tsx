import { useCallback, useMemo, useState } from "react";
import type { Ajustes, Intento } from "../types";
import { DURACIONES_CALENTAMIENTO, textoCalentamiento, wpmFantasmaCalentamiento } from "../lib/calentamientos";
import { analizar } from "../lib/debiles";
import { mediaSemanal } from "../lib/estadisticas";
import { formatoNumero } from "../lib/historial";
import { useHoy } from "../hooks/useHoy";
import { newSeed } from "../lib/rng";
import Tecleo from "./Tecleo";

interface Props {
  ajustes: Ajustes;
  intentos: readonly Intento[];
  onCambiarAjustes: (parcial: Partial<Ajustes>) => void;
  onIr: (pestana: "test") => void;
}

type Estado = { fase: "elegir" } | { fase: "tecleando"; seed: number; segundos: number } | { fase: "fin"; intento: Intento };

/** Calentar es teclear: un texto suave que va de la fila base al texto corrido, durante el tiempo elegido. */
export default function Calentar({ ajustes, intentos, onCambiarAjustes, onIr }: Props) {
  const [estado, setEstado] = useState<Estado>({ fase: "elegir" });
  const hoy = useHoy();
  const analisis = useMemo(() => analizar(intentos), [intentos]);
  const wpmMedio = useMemo(() => mediaSemanal([...intentos], hoy)?.wpm ?? null, [intentos, hoy]);

  const empezar = useCallback(() => setEstado({ fase: "tecleando", seed: newSeed(), segundos: ajustes.calentamientoMin * 60 }), [ajustes.calentamientoMin]);
  const volver = useCallback(() => setEstado({ fase: "elegir" }), []);
  const terminado = useCallback((intento: Intento) => setEstado({ fase: "fin", intento }), []);
  const sinGuardar = useCallback(() => undefined, []);

  const palabras = useMemo(
    () =>
      estado.fase === "tecleando"
        ? textoCalentamiento(estado.segundos, estado.seed, { puntuacion: ajustes.puntuacionYMayusculas, analisis, wpmMedio })
        : [],
    // El texto se fija al empezar: no debe cambiar mientras se teclea aunque cambien las estadísticas.
    [estado.fase === "tecleando" ? estado.seed : 0]
  );
  const config = useMemo(
    () =>
      estado.fase === "tecleando"
        ? { modo: "entreno" as const, fuente: "ejercicio" as const, ejercicioId: "calentamiento", durationSec: estado.segundos, seed: estado.seed, estricto: false }
        : null,
    [estado]
  );

  if (estado.fase === "tecleando" && config) {
    return (
      <Tecleo
        key={estado.seed}
        palabras={palabras}
        config={config}
        ajustes={ajustes}
        intentos={intentos}
        guardar={false}
        etiqueta={`Calentamiento · ${ajustes.calentamientoMin} min`}
        fantasmaWpm={wpmFantasmaCalentamiento(wpmMedio)}
        onGuardar={sinGuardar}
        onSalir={volver}
        onRepetir={volver}
        onTerminar={terminado}
      />
    );
  }

  if (estado.fase === "fin") {
    const i = estado.intento;
    return (
      <section className="tarjeta">
        <h1>Calentamiento hecho</h1>
        <p className="tenue">No cuenta para tus estadísticas de velocidad, pero sus pulsaciones suman al contador de arriba.</p>
        <div className="resultado-cifras">
          <div className="cifra">
            <div className="cifra-valor">{formatoNumero(i.acc)}%</div>
            <div className="cifra-etiqueta">precisión</div>
          </div>
          <div className="cifra">
            <div className="cifra-valor">{i.correct + i.errors}</div>
            <div className="cifra-etiqueta">pulsaciones</div>
          </div>
          <div className="cifra">
            <div className="cifra-valor">{i.errors}</div>
            <div className="cifra-etiqueta">errores</div>
          </div>
        </div>
        <div className="acciones">
          <button type="button" className="btn primario" onClick={() => onIr("test")} autoFocus>
            Ir al test
          </button>
          <button type="button" className="btn" onClick={volver}>
            Volver
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="tarjeta">
      <h1>Calentar</h1>
      <p className="tenue">
        Teclea un texto suave antes de los tests: empieza por la fila base, sigue con alternancia de manos y tus pares lentos, y acaba con texto corrido. Un cursor
        fantasma marca un ritmo tranquilo. No cuenta en las estadísticas de velocidad.
      </p>

      <div className="fila">
        <span>Duración</span>
        <div className="seg" role="group" aria-label="Duración del calentamiento">
          {DURACIONES_CALENTAMIENTO.map((m) => (
            <button key={m} type="button" className={ajustes.calentamientoMin === m ? "on" : ""} onClick={() => onCambiarAjustes({ calentamientoMin: m })}>
              {m} min
            </button>
          ))}
        </div>
      </div>

      <div className="acciones">
        <button type="button" className="btn primario" onClick={empezar} autoFocus>
          Empezar ({ajustes.calentamientoMin} min)
        </button>
      </div>
    </section>
  );
}
