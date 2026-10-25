import { useMemo } from "react";
import type { Ajustes, Intento } from "../types";
import {
  mediaSemanal,
  mediasSemanales,
  objetivoDelDia,
  racha,
  testsDelDia,
  tiempoDelDia,
  variacionSemanal,
} from "../lib/estadisticas";

import { formatoNumero, formatoTiempo, formatoVariacion, precisionBaja } from "../lib/historial";
import { useHoy } from "../hooks/useHoy";
import { calcularAjustes, focoDelDia, pasosDelDia, type PasoPlan } from "../lib/plan";

type Destino = "calentar" | "entrenar" | "test" | "estadisticas";

const DESTINO: Record<PasoPlan["id"], Destino> = {
  calentamiento: "calentar",
  entreno: "entrenar",
  tests: "test",
  revision: "estadisticas",
};
const ACCION: Record<PasoPlan["id"], string> = {
  calentamiento: "Calentar",
  entreno: "Entrenar",
  tests: "Hacer un test",
  revision: "Ver estadísticas",
};

interface Props {
  ajustes: Ajustes;
  intentos: readonly Intento[];
  onIr: (destino: Destino) => void;
}


export default function Hoy({ ajustes, intentos, onIr }: Props) {
  const hoy = useHoy();
  const datos = useMemo(() => {
    const lista = [...intentos];
    const semana = mediaSemanal(lista, hoy);
    return {
      objetivo: objetivoDelDia(lista, hoy, ajustes.objetivoTests),
      tiempo: tiempoDelDia(lista, hoy, ajustes.objetivoMinutos),
      racha: racha(lista, hoy, ajustes.objetivoTests),
      semana,
      variacion: variacionSemanal(mediasSemanales(lista, hoy, 2)),
      deHoy: testsDelDia(lista, hoy),
      foco: focoDelDia(hoy),
      ajustes: calcularAjustes(lista, hoy, ajustes.reglasDeAjuste),
      pasos: pasosDelDia(hoy, hoy, lista, ajustes.objetivoTests),
    };
  }, [intentos, hoy, ajustes.objetivoTests, ajustes.objetivoMinutos, ajustes.reglasDeAjuste]);

  const { objetivo, semana } = datos;

  return (
    <div>
      <section className="tarjeta hoy-resumen">
        <Anillo fraccion={objetivo.fraccion} hechos={objetivo.hechos} objetivo={objetivo.objetivo} />
        <div className="hoy-cifras">
          <div className="cifra">
            <div className="cifra-valor">{datos.racha}</div>
            <div className="cifra-etiqueta">{datos.racha === 1 ? "día de racha" : "días de racha"}</div>
          </div>
          <div className="cifra">
            <div className="cifra-valor">{semana ? formatoNumero(semana.wpm) : "—"}</div>
            <div className="cifra-etiqueta">ppm media 7 días</div>
            {semana && (
              <div className="tenue">
                {formatoNumero(semana.acc)} % de precisión
                {datos.variacion !== null && (
                  <span className={datos.variacion >= 0 ? "cifra-delta sube" : "cifra-delta baja"}>
                    {" "}
                    · {formatoVariacion(datos.variacion)} vs semana anterior
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="tarjeta">
        <div className="tiempo-cabecera">
          <h2>Tiempo de práctica hoy</h2>
          <span className="mono">
            {formatoTiempo(datos.tiempo.segundos)} / {datos.tiempo.objetivoMin} min
          </span>
        </div>
        <div
          className="cronometro-barra"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={datos.tiempo.objetivoMin * 60}
          aria-valuenow={Math.min(datos.tiempo.segundos, datos.tiempo.objetivoMin * 60)}
          aria-label="Tiempo de práctica de hoy"
        >
          <div className="cronometro-relleno" style={{ width: `${datos.tiempo.fraccion * 100}%`, background: datos.tiempo.cumplido ? "var(--ok)" : undefined }} />
        </div>
        <p className="tenue">{datos.tiempo.cumplido ? "Meta de tiempo cumplida." : "Cuentan tests y entrenos; los calentamientos no."}</p>
      </section>

      <section className="tarjeta">
        <h1>Plan de hoy · {datos.foco.dia}</h1>
        <p className="tenue">
          <b>{datos.foco.foco}.</b> {datos.foco.entreno.descripcion}
        </p>
        {datos.ajustes.ajustes.map((a) => (
          <p key={a.id} className="aviso-regla">
            {a.motivo}
          </p>
        ))}
        <ol className="plan">
          {datos.pasos.map((p) => (
            <li key={p.id} className={p.hecho ? "hecho" : ""}>
              <div>
                <b>
                  {p.hecho ? "✓ " : ""}
                  {p.titulo}
                </b>
                <div className="tenue">{p.detalle}</div>
              </div>
              <button type="button" className={p.id === "tests" && !p.hecho ? "btn primario" : "btn"} onClick={() => onIr(DESTINO[p.id])}>
                {ACCION[p.id]}
              </button>
            </li>
          ))}
        </ol>
      </section>

      {datos.deHoy.length > 0 && (
        <section className="tarjeta">
          <h2>Tests de hoy</h2>
          <div className="fichas">
            {datos.deHoy.map((i) => (
              <span key={i.id} className={`ficha mono${precisionBaja(i.acc) ? " baja-precision" : ""}`}>
                {formatoNumero(i.wpm)} ppm · {formatoNumero(i.acc)} %
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Anillo({ fraccion, hechos, objetivo }: { fraccion: number; hechos: number; objetivo: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="anillo" role="img" aria-label={`${hechos} de ${objetivo} tests hoy`}>
      <svg viewBox="0 0 110 110" width="110" height="110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--bg3)" strokeWidth="10" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={fraccion >= 1 ? "var(--ok)" : "var(--accent)"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${c * fraccion} ${c}`}
          transform="rotate(-90 55 55)"
        />
      </svg>
      <div className="anillo-num">
        <b>{hechos}</b>
        <span>/ {objetivo}</span>
      </div>
    </div>
  );
}
