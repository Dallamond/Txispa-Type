import { useState } from "react";
import { construirMes, mesAnterior, mesDeDia, mesSiguiente, nombreMes } from "../lib/calendario";
import { formatoDia } from "../lib/historial";

interface Props {
  /** Día de hoy "YYYY-MM-DD". */
  hoy: string;
  /** Días con el objetivo cumplido. */
  cumplidos: ReadonlySet<string>;
}

const CABECERA = ["L", "M", "X", "J", "V", "S", "D"];
const NOMBRE_DIA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export default function Calendario({ hoy, cumplidos }: Props) {
  const [mes, setMes] = useState(() => mesDeDia(hoy));
  const semanas = construirMes(mes.año, mes.mes, hoy, cumplidos);
  const titulo = `${nombreMes(mes.mes)} ${mes.año}`;
  const totalMes = semanas.flat().filter((c) => c.cumplido).length;

  return (
    <div className="calendario">
      <div className="cal-cabecera">
        <button type="button" className="btn" aria-label="Mes anterior" onClick={() => setMes(mesAnterior(mes))}>
          ‹
        </button>
        <h2 className="cal-titulo" aria-live="polite">
          {titulo}
        </h2>
        <button type="button" className="btn" aria-label="Mes siguiente" onClick={() => setMes(mesSiguiente(mes))}>
          ›
        </button>
      </div>
      <div className="cal-rejilla" role="table" aria-label={`Calendario de ${titulo}`}>
        <div className="cal-fila" role="row">
          {CABECERA.map((c, i) => (
            <div key={c} className="cal-dia-semana" role="columnheader" aria-label={NOMBRE_DIA[i]}>
              {c}
            </div>
          ))}
        </div>
        {semanas.map((semana, si) => (
          <div key={si} className="cal-fila" role="row">
            {semana.map((celda, ci) => {
              if (celda.dia === null) return <div key={ci} className="cal-celda vacia" role="cell" aria-hidden="true" />;
              const clases = ["cal-celda", celda.cumplido ? "cumplido" : "", celda.uneConAnterior ? "une" : "", celda.esHoy ? "hoy" : ""];
              const estado = celda.cumplido ? "objetivo cumplido" : "objetivo sin cumplir";
              return (
                <div
                  key={ci}
                  className={clases.filter(Boolean).join(" ")}
                  role="cell"
                  aria-label={`${formatoDia(celda.dia)}${celda.esHoy ? " (hoy)" : ""}: ${estado}`}
                  aria-current={celda.esHoy ? "date" : undefined}
                >
                  <span className="cal-num">{Number(celda.dia.slice(8))}</span>
                  {celda.cumplido && (
                    <span className="cal-marca" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="tenue">
        {totalMes} {totalMes === 1 ? "día cumplido" : "días cumplidos"} en {nombreMes(mes.mes)}. ✓ = objetivo diario de tests cumplido.
      </p>
    </div>
  );
}
