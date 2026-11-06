import { useMemo } from "react";
import type { Intento } from "../types";
import { PRECISION_MINIMA } from "../lib/medidas";
import { desgloseXp, nivelDe, xpTotal } from "../lib/xp";
import { logrosNuevos, TIERS } from "../lib/logros";
import { esLeccionSuperada, moduloDeLeccion } from "../lib/gamCurso";
import { useCuenta, useEntrada } from "../hooks/useAnimacion";

interface Props {
  intento: Intento;
  /** Historial (puede incluir ya este intento: se descarta por id). */
  intentos: readonly Intento[];
  objetivoTests: number;
}

const coma = (n: number) => String(n).replace(".", ",");

/** XP ganado, barra de nivel, hitos del curso y logros nuevos de un intento. Lo comparten
 * los resultados de test/entreno y los de las lecciones del curso. Si hay algo que celebrar,
 * lanza el confeti sobre la tarjeta (que debe ser `position: relative`). */
export default function ProgresoIntento({ intento, intentos, objetivoTests }: Props) {
  const listo = useEntrada();
  const datos = useMemo(() => {
    const previos = intentos.filter((i) => i.id !== intento.id);
    const xpAntes = xpTotal(previos);
    const desglose = desgloseXp(intento, previos);
    return {
      desglose,
      antes: nivelDe(xpAntes),
      despues: nivelDe(xpAntes + desglose.total),
      logros: logrosNuevos(previos, intento, { objetivoTests }),
    };
  }, [intentos, intento, objetivoTests]);
  const { desglose, antes, despues, logros } = datos;
  const xpAnim = useCuenta(desglose.total, 1200);
  const subeNivel = despues.nivel > antes.nivel;
  const hitoCurso = desglose.bonusDominada > 0 || desglose.bonusModulo > 0;
  const fiesta = subeNivel || desglose.bonusRecord > 0 || logros.length > 0 || hitoCurso;
  const fraccionXp = listo ? despues.fraccion : antes.fraccion;
  const modulo = intento.leccionId ? moduloDeLeccion(intento.leccionId) : null;
  const leccionSinSuperar = intento.fuente === "curso" && !esLeccionSuperada(intento);

  return (
    <>
      {fiesta && <Confeti />}
      <div className="xp-bloque">
        <div className="xp-cabecera">
          <span>
            <b>+{Math.round(xpAnim)} XP</b>
            <span className="tenue">
              {" "}
              · {desglose.base} base{desglose.multiplicador !== 1 ? ` (×${coma(desglose.multiplicador)} por precisión)` : ""}
              {desglose.bonusRecord > 0 ? ` + ${desglose.bonusRecord} récord` : ""}
              {desglose.bonusLimpio > 0 ? ` + ${desglose.bonusLimpio} test limpio` : ""}
              {desglose.bonusLeccion > 0 ? ` + ${desglose.bonusLeccion} lección superada` : ""}
              {desglose.bonusDominada > 0 ? ` + ${desglose.bonusDominada} lección dominada` : ""}
              {desglose.bonusModulo > 0 ? ` + ${desglose.bonusModulo} módulo completado` : ""}
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
        {desglose.bonusModulo > 0 && (
          <p className="hito-curso">
            📚 ¡Módulo {modulo} completado! <span className="tenue">+{desglose.bonusModulo} XP</span>
          </p>
        )}
        {desglose.bonusDominada > 0 && (
          <p className="hito-curso">
            🎓 ¡Lección dominada! <span className="tenue">Ya la tienes bien aprendida.</span>
          </p>
        )}
        {leccionSinSuperar && (
          <p className="tenue">
            Con un {PRECISION_MINIMA} % de precisión la lección cuenta como superada y da XP extra, además de acercarte a los logros del curso.
          </p>
        )}
      </div>

      {logros.length > 0 && (
        <div className="logros-nuevos">
          <h2>Logro{logros.length > 1 ? "s" : ""} desbloqueado{logros.length > 1 ? "s" : ""}</h2>
          <div className="fichas">
            {logros.map((n, i) => {
              const tier = TIERS.find((t) => t.id === n.nivel.tier)!;
              return (
                <span key={n.logro.id} className={`ficha-logro tier-${tier.id}`} style={{ animationDelay: `${0.4 + i * 0.15}s` }}>
                  <span aria-hidden="true">{tier.emoji}</span> <b>{n.logro.nombre}</b> · {tier.nombre}
                  <span className="tenue"> · {n.logro.descripcion(n.nivel.meta)}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

/** Confeti solo con CSS: piezas con posición, color y retardo fijos (sin aleatoriedad en el render). */
export function Confeti() {
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
