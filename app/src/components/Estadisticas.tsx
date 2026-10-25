import { useMemo, useState } from "react";
import type { Ajustes, Intento } from "../types";
import { DURACIONES } from "../lib/ajustes";
import { diaLocal, mediasSemanales, mediaSemanal, racha, resumenPorDia, soloTests, variacionSemanal } from "../lib/estadisticas";
import {
  etiquetaDuracion,
  filtrarPorDuracion,
  filtrarPorModo,
  formatoDia,
  formatoDiaCorto,
  formatoHora,
  formatoNumero,
  formatoVariacion,
  ordenarHistorial,
  precisionBaja,
  PRECISION_MINIMA,
  serieParaGrafica,
  type CampoOrden,
  type Direccion,
  type FiltroDuracion,
  type FiltroModo,
} from "../lib/historial";
import GraficaLinea from "./GraficaLinea";
import "../estadisticas.css";

interface Props {
  intentos: readonly Intento[];
  ajustes: Ajustes;
}

const MODOS: Array<{ id: FiltroModo; texto: string }> = [
  { id: "test", texto: "Test" },
  { id: "entreno", texto: "Entreno" },
  { id: "todos", texto: "Todos" },
];

const COLUMNAS: Array<{ campo: CampoOrden; texto: string }> = [
  { campo: "fecha", texto: "Fecha" },
  { campo: "velocidad", texto: "Velocidad" },
  { campo: "precision", texto: "Precisión" },
];

export default function Estadisticas({ intentos, ajustes }: Props) {
  const [duracion, setDuracion] = useState<FiltroDuracion>("todas");
  const [modo, setModo] = useState<FiltroModo>("test");
  const [orden, setOrden] = useState<{ campo: CampoOrden; dir: Direccion }>({ campo: "fecha", dir: "desc" });

  const hoy = diaLocal(new Date());
  const lista = useMemo(() => [...intentos], [intentos]);
  const tests = useMemo(() => soloTests(lista), [lista]);

  const resumen = useMemo(
    () => ({
      racha: racha(lista, hoy, ajustes.objetivoTests),
      mejor: tests.length ? tests.reduce((m, t) => (t.wpm > m.wpm ? t : m), tests[0]) : null,
      semana: mediaSemanal(lista, hoy),
      variacion: variacionSemanal(mediasSemanales(lista, hoy, 2)),
    }),
    [lista, tests, hoy, ajustes.objetivoTests]
  );

  const serie = useMemo(() => serieParaGrafica(lista, duracion, 60), [lista, duracion]);
  const dias = useMemo(() => resumenPorDia(lista, 14, hoy), [lista, hoy]);
  const historial = useMemo(() => {
    const filtrados = filtrarPorDuracion(filtrarPorModo(lista, modo), duracion);
    return ordenarHistorial(filtrados, orden.campo, orden.dir).slice(0, 30);
  }, [lista, modo, duracion, orden]);

  if (tests.length === 0) {
    return (
      <section className="tarjeta">
        <h1>Estadísticas</h1>
        <p className="tenue">
          Todavía no hay tests. Haz el primero en la pestaña Test y aquí verás tu velocidad con su precisión, la evolución y el historial.
        </p>
      </section>
    );
  }

  const cambiarOrden = (campo: CampoOrden) =>
    setOrden((o) => (o.campo === campo ? { campo, dir: o.dir === "desc" ? "asc" : "desc" } : { campo, dir: "desc" }));
  const etiquetas = serie.map((t) => formatoDiaCorto(t.localDate));

  return (
    <>
      <section className="tarjeta">
        <h1>Estadísticas</h1>
        <div className="est-cifras">
          <div className="cifra">
            <div className="cifra-valor">{tests.length}</div>
            <div className="cifra-etiqueta">Tests totales</div>
          </div>
          <div className="cifra">
            <div className="cifra-valor">{resumen.racha}</div>
            <div className="cifra-etiqueta">Racha (días)</div>
            <div className="est-cifra-sub">objetivo: {ajustes.objetivoTests} tests al día</div>
          </div>
          <div className="cifra">
            <div className="cifra-valor">{resumen.mejor ? formatoNumero(resumen.mejor.wpm) : "–"}</div>
            <div className="cifra-etiqueta">Mejor ppm</div>
            {resumen.mejor && <div className="est-cifra-sub">con {formatoNumero(resumen.mejor.acc)} % de precisión</div>}
          </div>
          <div className="cifra">
            <div className="cifra-valor">{resumen.semana ? formatoNumero(resumen.semana.wpm) : "–"}</div>
            <div className="cifra-etiqueta">Media 7 días (ppm)</div>
            {resumen.semana ? (
              <div className="est-cifra-sub">
                con {formatoNumero(resumen.semana.acc)} % de precisión
                {resumen.variacion !== null && (
                  <>
                    {" · "}
                    <span className={`cifra-delta ${resumen.variacion >= 0 ? "sube" : "baja"}`}>{formatoVariacion(resumen.variacion)}</span> frente a la semana
                    anterior
                  </>
                )}
              </div>
            ) : (
              <div className="est-cifra-sub">sin tests esta semana</div>
            )}
          </div>
        </div>
      </section>

      <section className="tarjeta">
        <div className="est-filtros">
          <h1>Evolución</h1>
          <div className="seg" role="group" aria-label="Filtrar por duración">
            <button type="button" className={duracion === "todas" ? "on" : ""} aria-pressed={duracion === "todas"} onClick={() => setDuracion("todas")}>
              Todas
            </button>
            {DURACIONES.map((d) => (
              <button key={d} type="button" className={duracion === d ? "on" : ""} aria-pressed={duracion === d} onClick={() => setDuracion(d)}>
                {etiquetaDuracion(d)}
              </button>
            ))}
          </div>
        </div>
        {serie.length === 0 ? (
          <p className="tenue">No hay tests de esta duración.</p>
        ) : (
          <>
            <p className="tenue">Últimos {serie.length} tests. Línea gruesa: media móvil de 5.</p>
            <h2>Velocidad neta (ppm)</h2>
            <GraficaLinea valores={serie.map((t) => t.wpm)} etiquetas={etiquetas} metrica="wpm" titulo="Velocidad neta" unidad="ppm" />
            <h2>Precisión (%)</h2>
            <GraficaLinea
              valores={serie.map((t) => t.acc)}
              etiquetas={etiquetas}
              metrica="acc"
              titulo="Precisión"
              unidad="%"
              umbralBajo={PRECISION_MINIMA}
            />
            <p className="tenue">Los puntos en rojo son tests con precisión por debajo del {PRECISION_MINIMA} %.</p>
          </>
        )}
      </section>

      <section className="tarjeta">
        <h1>Últimos 14 días</h1>
        {dias.length === 0 ? (
          <p className="tenue">Ningún test en los últimos 14 días.</p>
        ) : (
          <div className="est-tabla-caja">
            <table className="est-tabla">
              <thead>
                <tr>
                  <th scope="col">Día</th>
                  <th scope="col">Tests</th>
                  <th scope="col">Media</th>
                  <th scope="col">Mediana</th>
                  <th scope="col">Mejor</th>
                  <th scope="col">Peor</th>
                  <th scope="col">Precisión</th>
                </tr>
              </thead>
              <tbody>
                {dias.map((f) => (
                  <tr key={f.dia} className={precisionBaja(f.mediaAcc) ? "baja" : ""}>
                    <td>{formatoDia(f.dia)}</td>
                    <td>{f.tests}</td>
                    <td>{formatoNumero(f.mediaWpm)}</td>
                    <td>{formatoNumero(f.medianaWpm)}</td>
                    <td>{formatoNumero(f.mejorWpm)}</td>
                    <td>{formatoNumero(f.peorWpm)}</td>
                    <td className={precisionBaja(f.mediaAcc) ? "baja" : ""}>{formatoNumero(f.mediaAcc)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="tarjeta">
        <div className="est-filtros">
          <h1>Historial</h1>
          <div className="seg" role="group" aria-label="Filtrar por modo">
            {MODOS.map((m) => (
              <button key={m.id} type="button" className={modo === m.id ? "on" : ""} aria-pressed={modo === m.id} onClick={() => setModo(m.id)}>
                {m.texto}
              </button>
            ))}
          </div>
        </div>
        <p className="tenue">
          Últimos 30{duracion === "todas" ? "" : ` de ${etiquetaDuracion(duracion)}`}. Pulsa una cabecera para ordenar. Los entrenos no cuentan para las
          estadísticas de velocidad.
        </p>
        {historial.length === 0 ? (
          <p className="tenue">Nada que mostrar con estos filtros.</p>
        ) : (
          <div className="est-tabla-caja">
            <table className="est-tabla">
              <thead>
                <tr>
                  {COLUMNAS.map((c) => (
                    <th key={c.campo} scope="col" aria-sort={orden.campo === c.campo ? (orden.dir === "asc" ? "ascending" : "descending") : "none"}>
                      <button type="button" onClick={() => cambiarOrden(c.campo)}>
                        {c.texto}
                        {orden.campo === c.campo ? (orden.dir === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  ))}
                  <th scope="col">Duración</th>
                  <th scope="col">Modo</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((t) => (
                  <tr key={t.id} className={precisionBaja(t.acc) ? "baja" : ""}>
                    <td>
                      {formatoDia(t.localDate)} {formatoHora(t.date)}
                    </td>
                    <td>{formatoNumero(t.wpm)} ppm</td>
                    <td className={precisionBaja(t.acc) ? "baja" : ""}>{formatoNumero(t.acc)} %</td>
                    <td>{etiquetaDuracion(t.durationSec)}</td>
                    <td>{t.modo === "test" ? "Test" : "Entreno"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
