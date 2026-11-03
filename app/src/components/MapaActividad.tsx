import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Intento } from "../types";
import { mapaActividad, type CeldaActividad } from "../lib/actividad";
import { formatoTiempo } from "../lib/historial";
import "../actividad.css";

interface Props {
  intentos: readonly Intento[];
  hoy: string;
  objetivoMinutos: number;
}

/** Etiquetas de fila como en GitHub: solo lunes, miércoles y viernes. */
const FILAS = ["L", "", "X", "", "V", "", ""];

/** "martes, 3 de noviembre de 2026", sin depender de la zona del sistema. */
function nombreDia(dia: string): string {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-ES", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function textoCelda(c: CeldaActividad): { titulo: string; detalle: string } {
  const titulo = nombreDia(c.dia);
  if (c.nivel === 0) return { titulo, detalle: "Sin práctica" };
  const partes = [
    c.tests > 0 ? `${c.tests} ${c.tests === 1 ? "test" : "tests"}` : "",
    c.entrenos > 0 ? `${c.entrenos} ${c.entrenos === 1 ? "entreno" : "entrenos"}` : "",
  ].filter(Boolean);
  return {
    titulo,
    detalle: `${formatoTiempo(c.segundos)} · ${c.pulsaciones.toLocaleString("es-ES")} pulsaciones · ${partes.join(" y ")}`,
  };
}

/** Mapa de los días practicados en el último año, como el de contribuciones de GitHub. */
export default function MapaActividad({ intentos, hoy, objetivoMinutos }: Props) {
  const mapa = useMemo(() => mapaActividad(intentos, hoy, objetivoMinutos), [intentos, hoy, objetivoMinutos]);
  const [foco, setFoco] = useState<{ celda: CeldaActividad; x: number; y: number } | null>(null);
  const cajaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // En pantallas estrechas el mapa se desplaza: se empieza por lo más reciente, a la derecha.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const mostrar = (celda: CeldaActividad, el: HTMLElement) => {
    const caja = cajaRef.current?.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!caja) return;
    // El tooltip se centra en la celda, sin salirse por los lados de la tarjeta.
    const x = Math.min(Math.max(r.left + r.width / 2 - caja.left, 150), caja.width - 150);
    setFoco({ celda, x, y: r.top - caja.top });
  };

  const textoFoco = foco ? textoCelda(foco.celda) : null;

  return (
    <div className="actividad" ref={cajaRef}>
      <p className="actividad-resumen">
        <b>{mapa.diasConPractica}</b> {mapa.diasConPractica === 1 ? "día" : "días"} de práctica en el último año
        {mapa.diasConPractica > 0 && (
          <span className="tenue">
            {" "}
            · {formatoTiempo(mapa.segundos)} · {mapa.pulsaciones.toLocaleString("es-ES")} pulsaciones
          </span>
        )}
      </p>
      <div className="actividad-scroll" ref={scrollRef} onScroll={() => setFoco(null)}>
        <div className="actividad-rejilla" style={{ "--semanas": mapa.columnas.length } as CSSProperties}>
          <div className="actividad-meses" aria-hidden="true">
            {mapa.meses.map((m) => (
              <span key={`${m.columna}-${m.nombre}`} style={{ gridColumn: m.columna + 1 }}>
                {m.nombre}
              </span>
            ))}
          </div>
          <div className="actividad-filas" aria-hidden="true">
            {FILAS.map((f, i) => (
              <span key={i}>{f}</span>
            ))}
          </div>
          <div className="actividad-celdas" role="img" aria-label={`Mapa de actividad: ${mapa.diasConPractica} días de práctica en el último año`} onMouseLeave={() => setFoco(null)}>
            {mapa.columnas.flat().map((c) =>
              c.futuro ? (
                <span key={c.dia} className="actividad-celda futuro" />
              ) : (
                <span
                  key={c.dia}
                  className={`actividad-celda n${c.nivel}${c.dia === hoy ? " hoy" : ""}`}
                  onMouseEnter={(e) => mostrar(c, e.currentTarget)}
                />
              )
            )}
          </div>
        </div>
      </div>
      <div className="actividad-pie">
        <span className="tenue">
          Cuentan tests y entrenos. El color más fuerte es la meta de {objetivoMinutos} min cumplida.
        </span>
        <span className="actividad-leyenda tenue" aria-hidden="true">
          Menos
          {[0, 1, 2, 3, 4].map((n) => (
            <span key={n} className={`actividad-celda n${n}`} />
          ))}
          Más
        </span>
      </div>
      {foco && textoFoco && (
        <div className="actividad-tooltip" role="tooltip" style={{ left: foco.x, top: foco.y }}>
          <b>{textoFoco.detalle}</b>
          <span>{textoFoco.titulo}</span>
        </div>
      )}
    </div>
  );
}
