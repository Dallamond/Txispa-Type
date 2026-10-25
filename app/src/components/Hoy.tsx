import { useMemo } from "react";
import type { Ajustes, Intento } from "../types";
import {
  mediaSemanal,
  mediasSemanales,
  objetivoDelDia,
  racha,
  testsDelDia,
  variacionSemanal,
} from "../lib/estadisticas";

import { formatoNumero, formatoVariacion, precisionBaja } from "../lib/historial";
import { useHoy } from "../hooks/useHoy";

type Destino = "calentar" | "test" | "estadisticas";

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
      racha: racha(lista, hoy, ajustes.objetivoTests),
      semana,
      variacion: variacionSemanal(mediasSemanales(lista, hoy, 2)),
      deHoy: testsDelDia(lista, hoy),
    };
  }, [intentos, hoy, ajustes.objetivoTests]);

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
        <h1>Plan de hoy</h1>
        <ol className="plan">
          <li>
            <div>
              <b>Calentamiento</b>
              <div className="tenue">Suelta las manos antes de medirte. No cuenta en las estadísticas.</div>
            </div>
            <button type="button" className="btn" onClick={() => onIr("calentar")}>
              Calentar
            </button>
          </li>
          <li>
            <div>
              <b>
                Tests ({objetivo.hechos} de {objetivo.objetivo})
              </b>
              <div className="tenue">
                {objetivo.cumplido
                  ? "Objetivo cumplido. Cada test extra suma datos."
                  : `Te ${objetivo.objetivo - objetivo.hechos === 1 ? "falta 1 test" : `faltan ${objetivo.objetivo - objetivo.hechos} tests`} para cumplir el objetivo.`}
              </div>
            </div>
            <button type="button" className="btn primario" onClick={() => onIr("test")}>
              Hacer un test
            </button>
          </li>
          <li>
            <div>
              <b>Revisión</b>
              <div className="tenue">Mira tus teclas falladas y la evolución de la semana.</div>
            </div>
            <button type="button" className="btn" onClick={() => onIr("estadisticas")}>
              Ver estadísticas
            </button>
          </li>
        </ol>
        <p className="tenue">El entrenamiento diario dirigido a tus teclas débiles llega en la fase 3.</p>
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
