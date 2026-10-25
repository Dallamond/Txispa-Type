import { useCallback, useMemo, useState } from "react";
import type { Ajustes, Duracion, Intento } from "../types";
import { DURACIONES } from "../lib/ajustes";
import { newSeed } from "../lib/rng";
import { palabrasDelBanco } from "../lib/textos";
import { objetivoDelDia, mediaSemanal } from "../lib/estadisticas";
import { useHoy } from "../hooks/useHoy";
import type { ConfigIntento } from "../lib/intento";
import Tecleo from "./Tecleo";

interface Props {
  ajustes: Ajustes;
  intentos: readonly Intento[];
  onGuardar: (intento: Intento) => Promise<void>;
  /** Para recordar la última duración y las casillas entre sesiones. */
  onCambiarAjustes: (parcial: Partial<Ajustes>) => void;
}

const etiquetaDuracion = (s: number) => (s < 60 ? `${s} s` : s % 60 === 0 ? `${s / 60} min` : `${s} s`);

interface Prueba {
  config: ConfigIntento;
  palabras: string[];
  puntuacion: boolean;
}

export default function Test({ ajustes, intentos, onGuardar, onCambiarAjustes }: Props) {
  const [prueba, setPrueba] = useState<Prueba | null>(null);
  // La clave cambia en cada repetición para remontar la prueba con otro texto.
  const [clave, setClave] = useState(0);

  const empezar = useCallback(
    (durationSec: number) => {
      const seed = newSeed();
      const puntuacion = ajustes.puntuacionYMayusculas;
      setPrueba({
        config: { modo: "test", fuente: "banco", durationSec, seed, estricto: ajustes.estrictoPorDefecto },
        palabras: palabrasDelBanco(seed, { puntuacion }),
        puntuacion,
      });
      setClave((c) => c + 1);
    },
    [ajustes.puntuacionYMayusculas, ajustes.estrictoPorDefecto]
  );

  const salir = useCallback(() => setPrueba(null), []);
  const repetir = useCallback(() => empezar(prueba?.config.durationSec ?? ajustes.duracionPorDefecto), [empezar, prueba, ajustes.duracionPorDefecto]);

  const hoy = useHoy();
  const objetivo = useMemo(() => objetivoDelDia([...intentos], hoy, ajustes.objetivoTests), [intentos, hoy, ajustes.objetivoTests]);
  const semana = useMemo(() => mediaSemanal([...intentos], hoy), [intentos, hoy]);

  if (prueba) {
    return (
      <Tecleo
        key={clave}
        palabras={prueba.palabras}
        config={prueba.config}
        ajustes={ajustes}
        intentos={intentos}
        guardar
        etiqueta={`Test de ${etiquetaDuracion(prueba.config.durationSec)}`}
        onGuardar={onGuardar}
        onSalir={salir}
        onRepetir={repetir}
      />
    );
  }

  return (
    <section className="tarjeta">
      <h1>Test</h1>
      <p className="tenue">
        Prueba cronometrada que cuenta para tus estadísticas de velocidad. Hoy: {objetivo.hechos} de {objetivo.objetivo} tests
        {semana ? ` · media de 7 días ${semana.wpm.toFixed(1).replace(".", ",")} ppm` : ""}.
      </p>

      <div className="fila">
        <span>Duración</span>
        <div className="seg" role="group" aria-label="Duración">
          {DURACIONES.map((d: Duracion) => (
            <button
              key={d}
              type="button"
              className={ajustes.duracionPorDefecto === d ? "on" : ""}
              onClick={() => onCambiarAjustes({ duracionPorDefecto: d })}
            >
              {etiquetaDuracion(d)}
            </button>
          ))}
        </div>
      </div>

      <label className="fila">
        <span>Modo estricto (la letra equivocada no entra y no se cierra una palabra incompleta)</span>
        <input type="checkbox" checked={ajustes.estrictoPorDefecto} onChange={(e) => onCambiarAjustes({ estrictoPorDefecto: e.target.checked })} />
      </label>

      <label className="fila">
        <span>Puntuación y mayúsculas</span>
        <input
          type="checkbox"
          checked={ajustes.puntuacionYMayusculas}
          onChange={(e) => onCambiarAjustes({ puntuacionYMayusculas: e.target.checked })}
        />
      </label>

      <div className="acciones">
        <button type="button" className="btn primario" onClick={() => empezar(ajustes.duracionPorDefecto)} autoFocus>
          Comenzar
        </button>
      </div>
    </section>
  );
}
