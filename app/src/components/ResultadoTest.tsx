import { useEffect, useMemo, useState } from "react";
import type { Intento } from "../types";
import { mediaUltimos } from "../lib/estadisticas";
import { confusionesMasRepetidas, teclasMasFalladas } from "../lib/intento";
import { PRECISION_MINIMA } from "../lib/medidas";
import { etiquetasEje, posicionEnHistorial } from "../lib/historial";
import { desgloseXp, nivelDe, xpTotal } from "../lib/xp";
import { fraccionVelocimetro, PPM_MAX_VELOCIMETRO, simil } from "../lib/simil";
import { logrosNuevos } from "../lib/logros";
import { comparacionDelDia } from "../lib/delDia";
import GraficaLinea from "./GraficaLinea";

const fmt = (n: number, d = 1) => n.toFixed(d).replace(".", ",");

const sinMovimiento = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Cuenta de 0 a `valor` con easing; sin animación si el usuario la ha desactivado. */
function useCuenta(valor: number, ms = 1100): number {
  const [v, setV] = useState(() => (sinMovimiento() ? valor : 0));
  useEffect(() => {
    if (sinMovimiento()) {
      setV(valor);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const paso = (ahora: number) => {
      const p = Math.min(1, (ahora - t0) / ms);
      setV(valor * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor, ms]);
  return v;
}

/** true un instante después de montar: dispara las transiciones CSS de entrada. */
function useEntrada(): boolean {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setListo(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return listo;
}

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

  const datos = useMemo(() => {
    const previos = intentos.filter((i) => i.id !== intento.id);
    const media = comparar ? mediaUltimos([...intentos], 10, intento.id) : null;
    const xpAntes = xpTotal(previos);
    const desglose = desgloseXp(intento, previos);
    return {
      media,
      desglose,
      antes: nivelDe(xpAntes),
      despues: nivelDe(xpAntes + desglose.total),
      logros: logrosNuevos(previos, intento, { objetivoTests }),
      posicion: comparar ? posicionEnHistorial(intentos, intento) : null,
      dia: comparar ? comparacionDelDia(intentos, intento) : null,
      falladas: teclasMasFalladas(intento.teclas),
      confusiones: confusionesMasRepetidas(intento.confusiones, 3),
    };
  }, [intentos, intento, comparar, objetivoTests]);

  const { media, desglose, antes, despues, posicion, dia } = datos;
  const dW = media ? intento.wpm - media.wpm : null;
  const dA = media ? intento.acc - media.acc : null;
  const subeNivel = despues.nivel > antes.nivel;
  const esRecord = desglose.bonusRecord > 0;
  const fiesta = !vacio && (subeNivel || esRecord || datos.logros.length > 0);

  const s = simil(intento.wpm, intento.acc);
  const wpmAnim = useCuenta(vacio ? 0 : intento.wpm);
  const accAnim = useCuenta(vacio ? 0 : intento.acc, 900);
  const xpAnim = useCuenta(desglose.total, 1200);

  // Velocímetro: semicírculo de radio 80.
  const R = 80;
  const LARGO = Math.PI * R;
  const fraccion = listo ? fraccionVelocimetro(intento.wpm) : 0;

  // Barra de XP: si sube de nivel, primero se llena hasta el final y luego queda en el nivel nuevo.
  const fraccionXp = listo ? despues.fraccion : antes.fraccion;

  return (
    <section className={`tarjeta resultado${fiesta ? " con-fiesta" : ""}`}>
      {fiesta && <Confeti />}
      <h1>{etiqueta} · resultado</h1>

      {vacio ? (
        <p className="tenue">No se tecleó nada.</p>
      ) : (
        <>
          <div className="res-heroe">
            <div className="velocimetro" role="img" aria-label={`${fmt(intento.wpm)} palabras por minuto: ${s.escalon.nombre}`}>
              <svg viewBox="0 0 200 110" aria-hidden="true">
                <path className="vel-pista" d="M20 100 A80 80 0 0 1 180 100" pathLength={LARGO} />
                <path
                  className={`vel-arco${s.frenado ? " frenado" : ""}`}
                  d="M20 100 A80 80 0 0 1 180 100"
                  pathLength={LARGO}
                  strokeDasharray={`${LARGO * fraccion} ${LARGO}`}
                />
                {[0, 30, 60, 90].map((p) => {
                  const ang = Math.PI * (1 - p / PPM_MAX_VELOCIMETRO);
                  return (
                    <text key={p} className="vel-marca" x={100 + (R + 13) * Math.cos(ang)} y={100 - (R + 13) * Math.sin(ang) + 3} textAnchor="middle">
                      {p}
                    </text>
                  );
                })}
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

          <div className="xp-bloque">
            <div className="xp-cabecera">
              <span>
                <b>+{Math.round(xpAnim)} XP</b>
                <span className="tenue">
                  {" "}
                  · {desglose.base} base{desglose.multiplicador !== 1 ? ` (×${String(desglose.multiplicador).replace(".", ",")} por precisión)` : ""}
                  {desglose.bonusRecord > 0 ? ` + ${desglose.bonusRecord} récord` : ""}
                  {desglose.bonusLimpio > 0 ? ` + ${desglose.bonusLimpio} test limpio` : ""}
                </span>
              </span>
              <span className="xp-nivel">
                Nivel <b>{despues.nivel}</b> · {despues.rango}
              </span>
            </div>
            <div className="xp-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(despues.fraccion * 100)} aria-label="Progreso de nivel">
              <div style={{ width: `${fraccionXp * 100}%` }} />
            </div>
            <p className="tenue">
              {despues.enNivel} / {despues.tramo} XP para el nivel {despues.nivel + 1}
            </p>
            {subeNivel && (
              <p className="subida-nivel">
                ⬆️ ¡Subes al nivel {despues.nivel}! <span className="tenue">({despues.rango})</span>
              </p>
            )}
          </div>

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

          {datos.logros.length > 0 && (
            <div className="logros-nuevos">
              <h2>Logro{datos.logros.length > 1 ? "s" : ""} desbloqueado{datos.logros.length > 1 ? "s" : ""}</h2>
              <div className="fichas">
                {datos.logros.map((l, i) => (
                  <span key={l.id} className="ficha-logro" style={{ animationDelay: `${0.4 + i * 0.15}s` }} title={l.descripcion}>
                    <span aria-hidden="true">{l.emoji}</span> <b>{l.nombre}</b>
                    <span className="tenue"> · {l.descripcion}</span>
                  </span>
                ))}
              </div>
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
        <button type="button" className="btn primario" onClick={onRepetir} autoFocus>
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

/** Confeti solo con CSS: piezas con posición, color y retardo fijos (sin aleatoriedad en el render). */
function Confeti() {
  const piezas = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="confeti" aria-hidden="true">
      {piezas.map((i) => (
        <span
          key={i}
          style={
            {
              "--x": `${(i * 53) % 100}%`,
              "--d": `${(i % 6) * 0.12}s`,
              "--r": `${(i * 47) % 360}deg`,
              "--c": i % 3 === 0 ? "var(--accent)" : i % 3 === 1 ? "var(--ok)" : "var(--text)",
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
