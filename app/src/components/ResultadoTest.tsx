import { useEffect, useMemo, useRef } from "react";
import type { Intento } from "../types";
import { mediaUltimos } from "../lib/estadisticas";
import { confusionesMasRepetidas, teclasMasFalladas } from "../lib/intento";
import { PRECISION_MINIMA } from "../lib/medidas";
import { etiquetasEje, posicionEnHistorial } from "../lib/historial";
import { desgloseXp } from "../lib/xp";
import { fraccionVelocimetro, PPM_MAX_VELOCIMETRO, simil } from "../lib/simil";
import { comparacionDelDia } from "../lib/delDia";
import { useCuenta, useEntrada } from "../hooks/useAnimacion";
import GraficaLinea from "./GraficaLinea";
import ProgresoIntento from "./ProgresoIntento";

const CX = 120;
const CY = 120;
const RV = 96;
const ARCO = `M${CX - RV} ${CY} A${RV} ${RV} 0 0 1 ${CX + RV} ${CY}`;

const fmt = (n: number, d = 1) => n.toFixed(d).replace(".", ",");

interface Props {
  intento: Intento;
  etiqueta: string;
  intentos: readonly Intento[];
  comparar: boolean;
  objetivoTests: number;
  /** Desviación media al pulso del metrónomo (ms); undefined si no hubo metrónomo. */
  desviacionMs?: number | null;
  onRepetir: () => void;
  onSalir: () => void;
}

export default function ResultadoTest({ intento, etiqueta, intentos, comparar, objetivoTests, desviacionMs, onRepetir, onSalir }: Props) {
  const vacio = intento.correct + intento.errors === 0;
  const listo = useEntrada();
  const repetirRef = useRef<HTMLButtonElement>(null);

  // Al mostrar el resultado: arriba del todo, y el foco en «Repetir» sin que el navegador baje hasta el botón.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    repetirRef.current?.focus({ preventScroll: true });
  }, []);

  const datos = useMemo(() => {
    const previos = intentos.filter((i) => i.id !== intento.id);
    const media = comparar ? mediaUltimos([...intentos], 10, intento.id) : null;
    const desglose = desgloseXp(intento, previos);
    return {
      media,
      desglose,
      posicion: comparar ? posicionEnHistorial(intentos, intento) : null,
      dia: comparar ? comparacionDelDia(intentos, intento) : null,
      falladas: teclasMasFalladas(intento.teclas),
      confusiones: confusionesMasRepetidas(intento.confusiones, 3),
    };
  }, [intentos, intento, comparar, objetivoTests]);

  const { media, desglose, posicion, dia } = datos;
  const dW = media ? intento.wpm - media.wpm : null;
  const dA = media ? intento.acc - media.acc : null;
  const esRecord = desglose.bonusRecord > 0;

  const s = simil(intento.wpm, intento.acc);
  const wpmAnim = useCuenta(vacio ? 0 : intento.wpm);
  const accAnim = useCuenta(vacio ? 0 : intento.acc, 900);

  // Velocímetro: semicírculo con centro (CX, CY) y radio RV.
  const fraccion = listo ? fraccionVelocimetro(intento.wpm) : 0;
  const anguloAguja = -90 + 180 * fraccion;
  const marcas = Array.from({ length: PPM_MAX_VELOCIMETRO / 5 + 1 }, (_, k) => {
    const p = k * 5;
    const mayor = p % 10 === 0;
    const th = Math.PI * (1 - p / PPM_MAX_VELOCIMETRO);
    const c = Math.cos(th);
    const sn = Math.sin(th);
    const r1 = RV - (mayor ? 24 : 18);
    const r2 = RV - 9;
    return {
      p,
      mayor,
      x1: CX + r1 * c,
      y1: CY - r1 * sn,
      x2: CX + r2 * c,
      y2: CY - r2 * sn,
      tx: CX + (RV - 37) * c,
      ty: CY - (RV - 37) * sn + 3,
    };
  });

  return (
    <section className="tarjeta resultado">
      <h1>{etiqueta} · resultado</h1>

      {vacio ? (
        <p className="tenue">No se tecleó nada.</p>
      ) : (
        <>
          <div className="res-heroe">
            <div className="velocimetro" role="img" aria-label={`${fmt(intento.wpm)} palabras por minuto: ${s.escalon.nombre}`}>
              <svg viewBox="0 0 240 134" aria-hidden="true">
                <defs>
                  <linearGradient id="vel-grad" gradientUnits="userSpaceOnUse" x1={CX - RV} y1="0" x2={CX + RV} y2="0">
                    <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--accent) 30%, var(--bg3))" }} />
                    <stop offset="1" style={{ stopColor: "var(--accent)" }} />
                  </linearGradient>
                </defs>
                <path className="vel-pista" d={ARCO} pathLength={100} />
                <path
                  className={`vel-arco${s.frenado ? " frenado" : ""}`}
                  d={ARCO}
                  pathLength={100}
                  strokeDasharray={`${100 * fraccion} 100`}
                  style={{ opacity: listo && fraccion > 0 ? 1 : 0 }}
                />
                {marcas.map((m) => (
                  <g key={m.p} className={`vel-marca${m.mayor ? " mayor" : ""}${listo && m.p <= intento.wpm ? " on" : ""}`} style={{ transitionDelay: `${(m.p / PPM_MAX_VELOCIMETRO) * 1.1}s` }}>
                    <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} />
                    {m.mayor && (
                      <text x={m.tx} y={m.ty} textAnchor="middle">
                        {m.p}
                      </text>
                    )}
                  </g>
                ))}
                <g className="vel-aguja" style={{ transform: `rotate(${anguloAguja}deg)` }}>
                  <path d={`M${CX - 4.5} ${CY} L${CX} ${CY - (RV - 16)} L${CX + 4.5} ${CY} Z`} />
                </g>
                <circle className="vel-eje" cx={CX} cy={CY} r="8" />
                <circle className="vel-eje-centro" cx={CX} cy={CY} r="3" />
              </svg>
              <div className="vel-centro">
                <b className="vel-num">{fmt(wpmAnim)}</b>
                <span>ppm</span>
              </div>
            </div>

            <div className="simil">
              <div className={`simil-emoji${listo ? " entra" : ""}`} aria-hidden="true">
                {s.escalon.emoji}
              </div>
              <div>
                <div className="simil-nombre">
                  Vas como {s.escalon.articulo}{" "}
                  <b>{s.escalon.nombre.toLowerCase()}</b>
                </div>
                <p className="tenue">{s.frenado ? `Con ${fmt(intento.acc)} % de precisión el animal va con el freno puesto: baja un poco el ritmo.` : s.escalon.frase}</p>
                {s.siguiente && (
                  <>
                    <div className="simil-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(s.progreso * 100)} aria-label={`Hacia ${s.siguiente.nombre}`}>
                      <div style={{ width: `${listo ? s.progreso * 100 : 0}%` }} />
                    </div>
                    <p className="tenue">
                      {s.faltan > 0 ? `${fmt(s.faltan)} ppm para ${s.siguiente.nombre.toLowerCase()} ${s.siguiente.emoji}` : ""}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {esRecord && <p className="insignia-record">🏆 ¡Nuevo récord personal con {PRECISION_MINIMA} % de precisión o más!</p>}

          <div className="resultado-cifras">
            <Cifra valor={`${fmt(accAnim)}%`} etiqueta="precisión" delta={dA} sufijo="%" />
            <Cifra valor={fmt(intento.rawWpm)} etiqueta="ppm brutas" />
            <Cifra valor={intento.consistency === null ? "—" : `${Math.round(intento.consistency)}%`} etiqueta="ritmo constante" />
            <Cifra valor={String(intento.errors)} etiqueta="errores" />
            {dW !== null && <Cifra valor={`${dW >= 0 ? "+" : "−"}${fmt(Math.abs(dW))}`} etiqueta="ppm vs. tu media" />}
            {desviacionMs !== undefined && <Cifra valor={desviacionMs === null ? "—" : `${Math.round(desviacionMs)} ms`} etiqueta="desviación al pulso" />}
          </div>

          <ProgresoIntento intento={intento} intentos={intentos} objetivoTests={objetivoTests} />

          {dia && (
            <div className="dia-bloque">
              <h2>Frente a tus tests de hoy</h2>
              {dia.total === 1 ? (
                <p className="tenue">Es tu primer test de hoy: aún no hay con qué compararlo.</p>
              ) : (
                <>
                  <p>
                    {dia.esMejor ? "🥇 " : ""}
                    <b>
                      {dia.esMejor ? "El más rápido" : `El ${dia.puesto}.º más rápido`}
                    </b>{" "}
                    de tus {dia.total} tests de hoy
                    {dia.mediaOtros !== null && (
                      <span className="tenue">
                        {" "}
                        · {intento.wpm >= dia.mediaOtros ? "+" : "−"}
                        {fmt(Math.abs(intento.wpm - dia.mediaOtros))} ppm sobre la media del resto ({fmt(dia.mediaOtros)})
                      </span>
                    )}
                  </p>
                  <div className="dia-barras" role="img" aria-label={`Velocidad de los ${dia.total} tests de hoy; el actual es el ${dia.puesto}.º más rápido`}>
                    {dia.tests.map((t, i) => (
                      <div key={t.id} className={`dia-col${i === dia.indice ? " actual" : ""}${t.acc < PRECISION_MINIMA ? " baja" : ""}`}>
                        <span className="dia-val">{Math.round(t.wpm)}</span>
                        <div className="dia-barra">
                          <div style={{ height: `${listo ? (t.wpm / dia.mejor) * 100 : 0}%`, transitionDelay: `${0.3 + i * 0.07}s` }} />
                        </div>
                        <span className="dia-etq">{i === dia.indice ? "este" : i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <p className="tenue">Las barras apagadas son tests con precisión por debajo del {PRECISION_MINIMA} %.</p>
                </>
              )}
            </div>
          )}

          {intento.acc < PRECISION_MINIMA && (
            <p className="aviso-precision">
              Precisión por debajo del {PRECISION_MINIMA}%: esta velocidad no cuenta como progreso. Baja un poco el ritmo.
            </p>
          )}
          {media ? (
            <p className="tenue">
              {media.n === 1 ? "Comparado con tu test anterior" : `Comparado con la media de tus últimos ${media.n} tests`} ({fmt(media.wpm)} ppm, {fmt(media.acc)}%).
            </p>
          ) : (
            comparar && <p className="tenue">Es tu primer test: aún no hay con qué comparar.</p>
          )}

          {posicion && posicion.total > 1 && (
            <>
              <h2>Dónde queda entre tus {posicion.total} tests</h2>
              <p className="tenue">
                {posicion.esRecord ? `Es tu test más rápido con precisión de ${PRECISION_MINIMA}% o más. ` : ""}
                Puesto {posicion.puesto} de {posicion.total} por velocidad, contando también los de poca precisión (el punto grande es este test).
              </p>
              <GraficaLinea
                valores={posicion.serie.map((t) => t.wpm)}
                etiquetas={etiquetasEje(posicion.serie)}
                metrica="wpm"
                titulo="Velocidad neta de todos los tests"
                unidad="ppm"
                destacar={posicion.indice}
              />
            </>
          )}

          <h2>Teclas con más fallos en este test</h2>
          {datos.falladas.length === 0 ? (
            <p className="tenue">Ninguna. Test limpio.</p>
          ) : (
            <div className="fichas">
              {datos.falladas.map((t) => (
                <span key={t.tecla} className="ficha mono">
                  {t.tecla} ×{t.errores}
                </span>
              ))}
            </div>
          )}

          {datos.confusiones.length > 0 && (
            <>
              <h2>Confusiones</h2>
              <div className="fichas">
                {datos.confusiones.map((c) => (
                  <span key={`${c.esperada}>${c.escrita}`} className="ficha mono">
                    {c.esperada} → {c.escrita} ×{c.veces}
                  </span>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="acciones">
        <button ref={repetirRef} type="button" className="btn primario" onClick={onRepetir}>
          Repetir <kbd>⏎</kbd>
        </button>
        <button type="button" className="btn" onClick={onSalir}>
          Volver
        </button>
      </div>
    </section>
  );
}

function Cifra({ valor, etiqueta, delta, sufijo = "" }: { valor: string; etiqueta: string; delta?: number | null; sufijo?: string }) {
  return (
    <div className="cifra">
      <div className="cifra-valor">{valor}</div>
      <div className="cifra-etiqueta">{etiqueta}</div>
      {delta !== undefined && delta !== null && (
        <div className={`cifra-delta ${delta >= 0 ? "sube" : "baja"}`}>
          {delta >= 0 ? "+" : "−"}
          {fmt(Math.abs(delta))}
          {sufijo}
        </div>
      )}
    </div>
  );
}
