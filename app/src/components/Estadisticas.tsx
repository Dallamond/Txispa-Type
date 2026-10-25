import { useMemo, useState } from "react";
import type { Ajustes, Intento } from "../types";
import { DURACIONES } from "../lib/ajustes";
import {
  diasCumplidos,
  medianaDelDia,
  mediasSemanales,
  mediaSemanal,
  peorDelDia,
  pulsacionesTotales,
  racha,
  resumenPorDia,
  soloTests,
  tiempoDelDia,
  tendencia,
  variacionSemanal,
} from "../lib/estadisticas";
import { analizar, calorDeTeclas } from "../lib/debiles";
import { confusionesAgregadas } from "../lib/confusiones";
import {
  etiquetaDuracion,
  filtrarPorDuracion,
  filtrarPorModo,
  formatoDia,
  formatoDiaCorto,
  formatoHora,
  formatoNumero,
  formatoTiempo,
  formatoVariacion,
  ordenarHistorial,
  precisionBaja,
  serieParaGrafica,
  type CampoOrden,
  type Direccion,
  type FiltroDuracion,
  type FiltroModo,
} from "../lib/historial";
import { PRECISION_MINIMA } from "../lib/medidas";
import { useHoy } from "../hooks/useHoy";
import GraficaLinea from "./GraficaLinea";
import VirtualKeyboard from "./VirtualKeyboard";
import Calendario from "./Calendario";
import "../estadisticas.css";

interface Props {
  intentos: readonly Intento[];
  ajustes: Ajustes;
  onPracticar: (fuente: "debiles" | "pares") => void;
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

function formatoEntero(n: number): string {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 });
}

function formatoSigno(n: number): string {
  const s = formatoNumero(Math.abs(n), 1);
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${s}`;
}

export default function Estadisticas({ intentos, ajustes, onPracticar }: Props) {
  const [duracion, setDuracion] = useState<FiltroDuracion>("todas");
  const [modo, setModo] = useState<FiltroModo>("test");
  const [orden, setOrden] = useState<{ campo: CampoOrden; dir: Direccion }>({ campo: "fecha", dir: "desc" });

  const hoy = useHoy();
  const lista = useMemo(() => [...intentos], [intentos]);
  const tests = useMemo(() => soloTests(lista), [lista]);

  const resumen = useMemo(
    () => ({
      racha: racha(lista, hoy, ajustes.objetivoTests),
      // La velocidad con precisión por debajo del mínimo no cuenta como progreso.
      mejor: tests.filter((t) => t.acc >= PRECISION_MINIMA).reduce<Intento | null>((m, t) => (m === null || t.wpm > m.wpm ? t : m), null),
      semana: mediaSemanal(lista, hoy),
      variacion: variacionSemanal(mediasSemanales(lista, hoy, 2)),
    }),
    [lista, tests, hoy, ajustes.objetivoTests]
  );

  const analisis = useMemo(() => analizar(lista), [lista]);
  const calor = useMemo(() => calorDeTeclas(analisis), [analisis]);
  const confusiones = useMemo(() => confusionesAgregadas(lista), [lista]);
  const cumplidos = useMemo(() => diasCumplidos(lista, ajustes.objetivoTests), [lista, ajustes.objetivoTests]);
  const tendenciaSemanal = useMemo(() => tendencia(mediasSemanales(lista, hoy, 8)), [lista, hoy]);
  const pulsaciones = useMemo(() => pulsacionesTotales(lista), [lista]);
  const tiempoHoy = useMemo(() => tiempoDelDia(lista, hoy, ajustes.objetivoMinutos), [lista, hoy, ajustes.objetivoMinutos]);
  const medianaHoy = useMemo(() => medianaDelDia(lista, hoy), [lista, hoy]);
  const peorHoy = useMemo(() => peorDelDia(lista, hoy), [lista, hoy]);

  const serie = useMemo(() => serieParaGrafica(lista, duracion, 60), [lista, duracion]);
  const dias = useMemo(() => resumenPorDia(lista, 14, hoy), [lista, hoy]);
  const historial = useMemo(() => {
    const filtrados = filtrarPorDuracion(filtrarPorModo(lista, modo), duracion);
    // Primero los 30 más recientes y después se ordenan: ordenar antes recortaría otra cosa.
    const recientes = ordenarHistorial(filtrados, "fecha", "desc").slice(0, 30);
    return ordenarHistorial(recientes, orden.campo, orden.dir);
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
            <div className="cifra-valor">{formatoEntero(pulsaciones)}</div>
            <div className="cifra-etiqueta">Pulsaciones totales</div>
            <div className="est-cifra-sub">aciertos y errores, tests y entrenos</div>
          </div>
          <div className="cifra">
            <div className="cifra-valor">{formatoTiempo(tiempoHoy.segundos)}</div>
            <div className="cifra-etiqueta">Tiempo hoy</div>
            <div className="est-cifra-sub">meta: {ajustes.objetivoMinutos} min al día</div>
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

      <section className="tarjeta">
        <h1>Tendencia</h1>
        <div className="est-cifras">
          <div className="cifra">
            <div className="cifra-valor">{tendenciaSemanal !== null ? formatoSigno(tendenciaSemanal) : "–"}</div>
            <div className="cifra-etiqueta">ppm por semana</div>
            <div className="est-cifra-sub">
              {tendenciaSemanal !== null ? `Tendencia: ${formatoSigno(tendenciaSemanal)} ppm por semana` : "Tendencia: sin datos suficientes"}
            </div>
          </div>
          <div className="cifra">
            <div className="cifra-valor">{medianaHoy !== null ? formatoNumero(medianaHoy) : "–"}</div>
            <div className="cifra-etiqueta">Mediana de hoy (ppm)</div>
            {medianaHoy === null && <div className="est-cifra-sub">sin tests hoy</div>}
          </div>
          <div className="cifra">
            <div className="cifra-valor">{peorHoy !== null ? formatoNumero(peorHoy) : "–"}</div>
            <div className="cifra-etiqueta">Peor test de hoy (ppm)</div>
            {peorHoy === null && <div className="est-cifra-sub">sin tests hoy</div>}
          </div>
        </div>
        <p className="tenue">La tendencia es la pendiente de las medias semanales de las últimas 8 semanas.</p>
      </section>

      <section className="tarjeta">
        <h1>Teclas y pares débiles</h1>
        <p className="tenue">Calculado con tus últimos {analisis.intentosUsados} intentos (máximo 30).</p>
        <div className="deb-teclado">
          <VirtualKeyboard guide={false} calor={calor} />
        </div>
        <div className="deb-leyenda" aria-label="Leyenda del mapa de calor">
          <span className="deb-leyenda-item">
            <span className="deb-muestra sin-datos" aria-hidden="true" /> gris = pocos datos
          </span>
          <span className="deb-leyenda-item">
            <span className="deb-muestra rojo" aria-hidden="true" /> rojo = más problemas
          </span>
        </div>

        {analisis.debiles.length === 0 ? (
          <p className="tenue">
            Todavía no hay teclas débiles claras. Sigue haciendo tests y entrenos: cuando haya datos suficientes aparecerán aquí las teclas que más fallas o
            que tecleas más despacio.
          </p>
        ) : (
          <>
            <h2>Teclas débiles</h2>
            <div className="est-tabla-caja">
              <table className="est-tabla">
                <thead>
                  <tr>
                    <th scope="col">Tecla</th>
                    <th scope="col">Fallos</th>
                    <th scope="col">Latencia</th>
                  </tr>
                </thead>
                <tbody>
                  {analisis.debiles.map((t) => (
                    <tr key={t.tecla}>
                      <td>
                        <kbd className="deb-tecla">{t.tecla}</kbd>
                        {t.semilla && (
                          <>
                            {" "}
                            <span className="deb-semilla" title="dato inicial de typing.com, aún sin datos propios suficientes">
                              semilla
                            </span>
                          </>
                        )}
                      </td>
                      <td>{formatoNumero(t.errRate * 100)} %</td>
                      <td>{t.latRel !== null ? `×${formatoNumero(t.latRel)} de lo normal` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {analisis.debiles.some((t) => t.semilla) && (
              <p className="tenue">
                <span className="deb-semilla">semilla</span>: dato inicial de typing.com, aún sin datos propios suficientes.
              </p>
            )}
          </>
        )}

        <h2>Pares lentos</h2>
        {analisis.pares.length === 0 ? (
          <p className="tenue">Aún no hay pares claramente lentos.</p>
        ) : (
          <div className="est-tabla-caja">
            <table className="est-tabla">
              <thead>
                <tr>
                  <th scope="col">Par</th>
                  <th scope="col">Tiempo medio</th>
                  <th scope="col">Veces</th>
                  <th scope="col">Latencia</th>
                </tr>
              </thead>
              <tbody>
                {analisis.pares.map((p) => (
                  <tr key={p.par}>
                    <td>
                      <kbd className="deb-tecla">{p.par}</kbd>
                    </td>
                    <td>{formatoEntero(p.ms)} ms</td>
                    <td>{formatoEntero(p.n)}</td>
                    <td>×{formatoNumero(p.latRel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="deb-acciones">
          <button type="button" className="btn primario" disabled={analisis.debiles.length === 0} onClick={() => onPracticar("debiles")}>
            Practicar teclas problemáticas
          </button>
          <button type="button" className="btn" disabled={analisis.pares.length === 0} onClick={() => onPracticar("pares")}>
            Practicar pares lentos
          </button>
        </div>
      </section>

      <section className="tarjeta">
        <h1>Confusiones</h1>
        {confusiones.length === 0 ? (
          <p className="tenue">Sin confusiones registradas en tus últimos intentos. Buena señal.</p>
        ) : (
          <>
            <p className="tenue">Las más repetidas en tus últimos {analisis.intentosUsados} intentos: lo que debías teclear → lo que tecleaste.</p>
            <ol className="conf-lista">
              {confusiones.map((c) => (
                <li key={`${c.esperada}>${c.escrita}`}>
                  <kbd className="deb-tecla">{c.esperada}</kbd> → <kbd className="deb-tecla">{c.escrita}</kbd> · {c.veces} {c.veces === 1 ? "vez" : "veces"} ·{" "}
                  {formatoEntero(c.porcentaje)} %
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      <section className="tarjeta">
        <h1>Calendario</h1>
        <Calendario hoy={hoy} cumplidos={cumplidos} />
      </section>
    </>
  );
}
