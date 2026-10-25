import { useCallback, useEffect, useMemo, useState } from "react";
import type { Ajustes, Fuente, Intento } from "../types";
import { analizar } from "../lib/debiles";
import { mediaSemanal } from "../lib/estadisticas";
import type { ConfigIntento } from "../lib/intento";
import { calcularAjustes, focoDelDia, type FuenteEntreno } from "../lib/plan";
import { newSeed } from "../lib/rng";
import { PALABRAS_MINIMAS, palabrasAlternancia, palabrasDebiles, palabrasDelBanco } from "../lib/textos";
import { WPM_INICIAL, pulsoInicial } from "../lib/calentamientos";
import { useHoy } from "../hooks/useHoy";
import Tecleo from "./Tecleo";

export type FuenteEntrenar = "debiles" | "pares" | "alternancia" | "banco" | "metronomo";

export interface PedidoEntreno {
  fuente: FuenteEntrenar;
  /** Cambia en cada petición para poder pedir lo mismo dos veces. */
  n: number;
}

interface Props {
  ajustes: Ajustes;
  intentos: readonly Intento[];
  onGuardar: (intento: Intento) => Promise<void>;
  /** Petición desde otra pantalla ("Practicar teclas problemáticas"): empieza al llegar. */
  pedido: PedidoEntreno | null;
}

const FUENTES: { id: FuenteEntrenar; nombre: string; detalle: string }[] = [
  { id: "debiles", nombre: "Teclas débiles", detalle: "Palabras con tus teclas y pares más flojos." },
  { id: "pares", nombre: "Pares lentos", detalle: "Solo refuerza los pares de letras en los que pierdes tiempo." },
  { id: "alternancia", nombre: "Alternancia de manos", detalle: "Palabras que cambian de mano a cada letra." },
  { id: "banco", nombre: "Texto corrido", detalle: "Párrafos naturales en español." },
  { id: "metronomo", nombre: "Metrónomo", detalle: "Texto al compás de un pulso que puedes subir o bajar." },
];

const DURACIONES_ENTRENO = [60, 120, 300, 600, 720];
const etiqueta = (s: number) => (s >= 60 ? `${s / 60} min` : `${s} s`);

interface Sesion {
  config: ConfigIntento;
  palabras: string[];
  titulo: string;
  fantasmaWpm: number | null;
  /** Para repetir la misma sesión con otro texto. */
  fuenteUi: FuenteEntrenar;
  fantasmaPorcentaje: number | null;
  pulsoWpm: number | null;
}

/** De la fuente del plan a la que sabe generar la pantalla (la IA llega en la fase 4). */
function fuenteDelPlan(f: FuenteEntreno): FuenteEntrenar {
  return f === "ia" ? "banco" : f;
}

export default function Entrenar({ ajustes, intentos, onGuardar, pedido }: Props) {
  const [fuente, setFuente] = useState<FuenteEntrenar>("debiles");
  const [duracion, setDuracion] = useState(300);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [clave, setClave] = useState(0);
  const hoy = useHoy();

  const analisis = useMemo(() => analizar(intentos), [intentos]);
  const foco = focoDelDia(hoy);
  const wpmMedio = useMemo(() => mediaSemanal([...intentos], hoy)?.wpm ?? null, [intentos, hoy]);

  const empezar = useCallback(
    (f: FuenteEntrenar, durationSec: number, fantasmaPorcentaje: number | null = null) => {
      const seed = newSeed();
      const op = { puntuacion: ajustes.puntuacionYMayusculas, minPalabras: Math.max(PALABRAS_MINIMAS, Math.ceil((durationSec / 60) * 110)) };
      let palabras: string[];
      switch (f) {
        case "debiles":
          palabras = palabrasDebiles(seed, analisis, op);
          break;
        case "pares":
          palabras = analisis.pares.length > 0 ? palabrasDebiles(seed, analisis, op, true) : palabrasAlternancia(seed, op);
          break;
        case "alternancia":
          palabras = palabrasAlternancia(seed, op);
          break;
        default:
          palabras = palabrasDelBanco(seed, op);
      }
      const fuenteGuardada: Fuente =
        f === "debiles" || f === "pares" ? "debiles" : f === "alternancia" ? "alternancia" : f === "metronomo" ? "ejercicio" : "banco";
      setSesion({
        config: {
          modo: "entreno",
          fuente: fuenteGuardada,
          ...(f === "metronomo" ? { ejercicioId: "metronomo" } : {}),
          durationSec,
          seed,
          estricto: ajustes.estrictoPorDefecto,
        },
        palabras,
        titulo: `Entreno · ${FUENTES.find((x) => x.id === f)?.nombre ?? f} · ${etiqueta(durationSec)}`,
        fantasmaWpm: fantasmaPorcentaje === null ? null : (wpmMedio ?? WPM_INICIAL) * fantasmaPorcentaje,
        fuenteUi: f,
        fantasmaPorcentaje,
        pulsoWpm: f === "metronomo" ? pulsoInicial(wpmMedio) : null,
      });
      setClave((c) => c + 1);
    },
    [analisis, ajustes.puntuacionYMayusculas, ajustes.estrictoPorDefecto, wpmMedio]
  );

  // Petición desde otra pantalla: se atiende una sola vez por número de petición.
  const [atendido, setAtendido] = useState(0);
  useEffect(() => {
    if (pedido && pedido.n !== atendido) {
      setAtendido(pedido.n);
      setFuente(pedido.fuente);
      empezar(pedido.fuente, 300);
    }
  }, [pedido, atendido, empezar]);

  const salir = useCallback(() => setSesion(null), []);
  const repetir = useCallback(() => {
    if (sesion) empezar(sesion.fuenteUi, sesion.config.durationSec, sesion.fantasmaPorcentaje);
  }, [sesion, empezar]);

  if (sesion) {
    return (
      <Tecleo
        key={clave}
        palabras={sesion.palabras}
        config={sesion.config}
        ajustes={ajustes}
        intentos={intentos}
        guardar
        etiqueta={sesion.titulo}
        fantasmaWpm={sesion.fantasmaWpm}
        pulsoWpm={sesion.pulsoWpm}
        onGuardar={onGuardar}
        onSalir={salir}
        onRepetir={repetir}
      />
    );
  }

  const planAjustes = calcularAjustes([...intentos], hoy, ajustes.reglasDeAjuste);
  const fuenteHoy = fuenteDelPlan(foco.entreno.fuente);
  const porcentajeHoy = foco.entreno.porcentajeVelocidad === undefined ? null : planAjustes.porcentajeLento;
  const hayEntrenoHoy = foco.entreno.minutos > 0;

  return (
    <section className="tarjeta">
      <h1>Entrenar</h1>
      <p className="tenue">
        Práctica dirigida a tus puntos débiles. No cuenta para las estadísticas de velocidad, pero alimenta tus teclas, pares y confusiones.
      </p>

      <div className="entreno-hoy">
        <div>
          <b>
            Hoy ({foco.dia}): {foco.foco}
          </b>
          <div className="tenue">{foco.entreno.descripcion}</div>
          {planAjustes.ajustes.map((a) => (
            <div key={a.id} className="tenue">
              {a.motivo}
            </div>
          ))}
        </div>
        {hayEntrenoHoy ? (
          <button type="button" className="btn primario" onClick={() => empezar(fuenteHoy, foco.entreno.minutos * 60, porcentajeHoy)}>
            Entreno del día ({foco.entreno.minutos} min)
          </button>
        ) : (
          <span className="tenue">Hoy toca medirse: haz los tests de 60 s y 120 s.</span>
        )}
      </div>

      <h2>Elegir a mano</h2>
      <div className="fuentes" role="radiogroup" aria-label="Fuente del texto">
        {FUENTES.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={fuente === f.id}
            className={`fuente${fuente === f.id ? " on" : ""}`}
            onClick={() => setFuente(f.id)}
          >
            <b>{f.nombre}</b>
            <span className="tenue">{f.detalle}</span>
          </button>
        ))}
      </div>

      <div className="fila">
        <span>Duración</span>
        <div className="seg" role="group" aria-label="Duración">
          {DURACIONES_ENTRENO.map((d) => (
            <button key={d} type="button" className={duracion === d ? "on" : ""} onClick={() => setDuracion(d)}>
              {etiqueta(d)}
            </button>
          ))}
        </div>
      </div>

      <div className="fila">
        <span>Ahora mismo reforzaría</span>
        <div className="fichas">
          {analisis.debiles.length === 0 ? (
            <span className="tenue">Aún no hay teclas débiles claras.</span>
          ) : (
            analisis.debiles.map((t) => (
              <span key={t.tecla} className="ficha mono" title={t.semilla ? "Dato inicial de typing.com" : undefined}>
                {t.tecla}
                {t.semilla ? "*" : ""}
              </span>
            ))
          )}
        </div>
      </div>
      {analisis.debiles.some((t) => t.semilla) && <p className="tenue">* Datos iniciales de typing.com: se irán sustituyendo por los tuyos.</p>}

      <div className="acciones">
        <button type="button" className="btn primario" onClick={() => empezar(fuente, duracion)}>
          Comenzar
        </button>
      </div>
    </section>
  );
}
