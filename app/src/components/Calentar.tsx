import { useCallback, useEffect, useMemo, useState } from "react";
import type { Ajustes, Intento, Rutina } from "../types";
import {
  EJERCICIOS,
  PAUSA_ENTRE_EJERCICIOS,
  RUTINAS,
  duracionDisponible,
  ejerciciosDeRutina,
  pasoGuiado,
  textoEjercicio,
  wpmFantasma,
  type Ejercicio,
} from "../lib/calentamientos";
import { diaLocal, mediaSemanal } from "../lib/estadisticas";
import { newSeed } from "../lib/rng";
import Tecleo from "./Tecleo";

interface Props {
  ajustes: Ajustes;
  intentos: readonly Intento[];
  onCambiarAjustes: (parcial: Partial<Ajustes>) => void;
  onIr: (pestana: "test") => void;
}

const NOMBRE_RUTINA: Record<Rutina, string> = {
  rapida: "Rápida",
  estandar: "Estándar",
  completa: "Completa",
};

const minutos = (s: number) => (s >= 60 ? `${Math.round(s / 60)} min` : `${s} s`);

interface Sesion {
  ejercicios: Ejercicio[];
  /** Índice del ejercicio en curso o por empezar. */
  i: number;
  estado: "pausa" | "haciendo" | "fin";
  /** Errores de los ejercicios de texto ya hechos, para el resumen final. */
  errores: { nombre: string; errores: number }[];
}

export default function Calentar({ ajustes, intentos, onCambiarAjustes, onIr }: Props) {
  const [sesion, setSesion] = useState<Sesion | null>(null);

  const empezar = useCallback((ejercicios: Ejercicio[]) => {
    if (ejercicios.length > 0) setSesion({ ejercicios, i: 0, estado: "pausa", errores: [] });
  }, []);

  const salir = useCallback(() => setSesion(null), []);

  const avanzar = useCallback((errores?: { nombre: string; errores: number }) => {
    setSesion((s) => {
      if (!s) return s;
      const acumulados = errores ? [...s.errores, errores] : s.errores;
      return s.i + 1 >= s.ejercicios.length
        ? { ...s, estado: "fin", errores: acumulados }
        : { ...s, i: s.i + 1, estado: "pausa", errores: acumulados };
    });
  }, []);

  if (!sesion) {
    return <Elegir ajustes={ajustes} onCambiarAjustes={onCambiarAjustes} onEmpezar={empezar} />;
  }

  if (sesion.estado === "fin") {
    return (
      <section className="tarjeta">
        <h1>Calentamiento hecho</h1>
        <p className="tenue">No cuenta para tus estadísticas: es solo para soltar las manos.</p>
        {sesion.errores.length > 0 && (
          <div className="fichas">
            {sesion.errores.map((e) => (
              <span key={e.nombre} className="ficha">
                {e.nombre}: {e.errores === 0 ? "sin errores" : `${e.errores} errores`}
              </span>
            ))}
          </div>
        )}
        <div className="acciones">
          <button type="button" className="btn primario" onClick={() => onIr("test")} autoFocus>
            Ir al test
          </button>
          <button type="button" className="btn" onClick={salir}>
            Volver
          </button>
        </div>
      </section>
    );
  }

  const ej = sesion.ejercicios[sesion.i];
  const cabecera = `Ejercicio ${sesion.i + 1} de ${sesion.ejercicios.length}`;

  if (sesion.estado === "pausa") {
    return <Pausa key={`p${sesion.i}`} ejercicio={ej} cabecera={cabecera} onListo={() => setSesion({ ...sesion, estado: "haciendo" })} onSalir={salir} />;
  }

  if (ej.tipo === "guiado") {
    return <Guiado key={`g${sesion.i}`} ejercicio={ej} cabecera={cabecera} onTerminar={() => avanzar()} onSalir={salir} />;
  }

  return (
    <EjercicioTexto
      key={`t${sesion.i}`}
      ejercicio={ej}
      cabecera={cabecera}
      ajustes={ajustes}
      intentos={intentos}
      onTerminar={(errores) => avanzar({ nombre: ej.nombre, errores })}
      onSalir={salir}
    />
  );
}

function Elegir({
  ajustes,
  onCambiarAjustes,
  onEmpezar,
}: {
  ajustes: Ajustes;
  onCambiarAjustes: (parcial: Partial<Ajustes>) => void;
  onEmpezar: (ejercicios: Ejercicio[]) => void;
}) {
  const rutina = ajustes.rutinaCalentamiento;
  const ejercicios = ejerciciosDeRutina(rutina);
  const total = duracionDisponible(rutina);
  const pendientes = RUTINAS[rutina].length - ejercicios.length;

  return (
    <section className="tarjeta">
      <h1>Calentar</h1>
      <p className="tenue">Antes de los tests. Los resultados de los calentamientos no cuentan en las estadísticas.</p>

      <div className="fila">
        <span>Rutina</span>
        <div className="seg" role="group" aria-label="Rutina">
          {(Object.keys(NOMBRE_RUTINA) as Rutina[]).map((r) => (
            <button key={r} type="button" className={rutina === r ? "on" : ""} onClick={() => onCambiarAjustes({ rutinaCalentamiento: r })}>
              {NOMBRE_RUTINA[r]} ({minutos(duracionDisponible(r))})
            </button>
          ))}
        </div>
      </div>

      <ol className="lista-ejercicios">
        {ejercicios.map((e) => (
          <li key={e.id}>
            <b>{e.nombre}</b> <span className="tenue">· {minutos(e.segundos)} · {e.entrena}</span>
          </li>
        ))}
      </ol>
      {pendientes > 0 && <p className="tenue">{pendientes} ejercicios de esta rutina llegan en la fase 3.</p>}

      <div className="acciones">
        <button type="button" className="btn primario" onClick={() => onEmpezar(ejercicios)} autoFocus>
          Empezar ({minutos(total)})
        </button>
      </div>

      <h2>Ejercicio suelto</h2>
      <div className="fichas">
        {Object.values(EJERCICIOS)
          .filter((e) => e.disponible)
          .map((e) => (
            <button key={e.id} type="button" className="btn" onClick={() => onEmpezar([e])}>
              {e.nombre}
            </button>
          ))}
      </div>
    </section>
  );
}

/** Cuenta atrás de 3 s antes de cada ejercicio, con botón para saltarla. */
function Pausa({ ejercicio, cabecera, onListo, onSalir }: { ejercicio: Ejercicio; cabecera: string; onListo: () => void; onSalir: () => void }) {
  const [restante, setRestante] = useState(PAUSA_ENTRE_EJERCICIOS);

  useEffect(() => {
    const id = setInterval(() => setRestante((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (restante <= 0) onListo();
  }, [restante, onListo]);

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSalir();
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [onSalir]);

  return (
    <section className="tarjeta calentar-pausa">
      <p className="tenue">{cabecera}</p>
      <h1>{ejercicio.nombre}</h1>
      <p>{ejercicio.detalle}</p>
      <div className="cronometro-num mono">{Math.max(0, restante)}</div>
      <div className="acciones">
        <button type="button" className="btn primario" onClick={onListo} autoFocus>
          Empezar ya
        </button>
        <button type="button" className="btn" onClick={onSalir}>
          Salir
        </button>
      </div>
    </section>
  );
}

function Guiado({
  ejercicio,
  cabecera,
  onTerminar,
  onSalir,
}: {
  ejercicio: Ejercicio;
  cabecera: string;
  onTerminar: () => void;
  onSalir: () => void;
}) {
  const [t, setT] = useState(0);

  useEffect(() => {
    const inicio = performance.now();
    const id = setInterval(() => setT((performance.now() - inicio) / 1000), 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (t >= ejercicio.segundos) onTerminar();
  }, [t, ejercicio.segundos, onTerminar]);

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSalir();
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [onSalir]);

  const id = ejercicio.id === "arana" ? "arana" : "manos";
  const paso = pasoGuiado(id, Math.min(t, ejercicio.segundos));

  return (
    <section className="tarjeta calentar-pausa">
      <p className="tenue">{cabecera} · {ejercicio.nombre}</p>
      <h1 role="status">{paso.titulo}</h1>
      <p>{paso.detalle}</p>
      <div className="cronometro-barra">
        <div className="cronometro-relleno" style={{ width: `${(Math.min(t, ejercicio.segundos) / ejercicio.segundos) * 100}%` }} />
      </div>
      <div className="cronometro-num mono">{Math.max(0, Math.ceil(ejercicio.segundos - t))}</div>
      <div className="acciones">
        <button type="button" className="btn" onClick={onTerminar} autoFocus>
          Saltar
        </button>
        <button type="button" className="btn" onClick={onSalir}>
          Salir
        </button>
      </div>
    </section>
  );
}

function EjercicioTexto({
  ejercicio,
  cabecera,
  ajustes,
  intentos,
  onTerminar,
  onSalir,
}: {
  ejercicio: Ejercicio;
  cabecera: string;
  ajustes: Ajustes;
  intentos: readonly Intento[];
  onTerminar: (errores: number) => void;
  onSalir: () => void;
}) {
  const seed = useMemo(() => newSeed(), []);
  const palabras = useMemo(() => textoEjercicio(ejercicio.id, seed, { puntuacion: ajustes.puntuacionYMayusculas }), [ejercicio.id, seed, ajustes.puntuacionYMayusculas]);
  const config = useMemo(
    () => ({ modo: "entreno" as const, fuente: "ejercicio" as const, ejercicioId: ejercicio.id, durationSec: ejercicio.segundos, seed, estricto: false }),
    [ejercicio.id, ejercicio.segundos, seed]
  );
  const wpmMedio = useMemo(() => mediaSemanal([...intentos], diaLocal(new Date()))?.wpm ?? null, [intentos]);
  const fantasma = wpmFantasma(ejercicio.id, wpmMedio);
  const sinGuardar = useCallback(() => undefined, []);

  return (
    <div>
      <p className="tenue">{ejercicio.detalle}</p>
      <Tecleo
        palabras={palabras}
        config={config}
        ajustes={ajustes}
        intentos={intentos}
        guardar={false}
        etiqueta={`${cabecera} · ${ejercicio.nombre}`}
        fantasmaWpm={fantasma}
        onGuardar={sinGuardar}
        onSalir={onSalir}
        onRepetir={onSalir}
        onTerminar={(i) => onTerminar(i.errors)}
      />
    </div>
  );
}
