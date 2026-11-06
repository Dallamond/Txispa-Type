import { useMemo } from "react";
import type { Intento } from "../types";
import { estadoLogros, nivelesDe, TIERS } from "../lib/logros";
import { nivelDe, RANGOS, xpTotal } from "../lib/xp";

interface Props {
  intentos: readonly Intento[];
  objetivoTests: number;
}

const num = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
const emojiDe = (tier: string) => TIERS.find((t) => t.id === tier)?.emoji ?? "";
const nombreDe = (tier: string) => TIERS.find((t) => t.id === tier)?.nombre ?? "";

export default function Logros({ intentos, objetivoTests }: Props) {
  const { nivel, estados } = useMemo(
    () => ({ nivel: nivelDe(xpTotal(intentos)), estados: estadoLogros(intentos, { objetivoTests }) }),
    [intentos, objetivoTests]
  );
  const siguienteRango = RANGOS.find((r) => r.desde > nivel.nivel) ?? null;
  const totalNiveles = estados.reduce((n, e) => n + e.logro.metas.length, 0);
  const alcanzados = estados.reduce((n, e) => n + e.alcanzados, 0);
  const porTier = TIERS.map((t, i) => ({ ...t, n: estados.filter((e) => e.alcanzados > i).length }));

  return (
    <div>
      <section className="tarjeta nivel-tarjeta">
        <div className="nivel-insignia" aria-hidden="true">
          {nivel.nivel}
        </div>
        <div className="nivel-datos">
          <h1>{nivel.rango}</h1>
          <p className="tenue">
            Nivel {nivel.nivel} · {nivel.xp.toLocaleString("es-ES")} XP en total
          </p>
          <div className="xp-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(nivel.fraccion * 100)} aria-label="Progreso de nivel">
            <div style={{ width: `${nivel.fraccion * 100}%` }} />
          </div>
          <p className="tenue">
            {nivel.enNivel} / {nivel.tramo} XP para el nivel {nivel.nivel + 1}
            {siguienteRango ? ` · «${siguienteRango.nombre}» en el nivel ${siguienteRango.desde}` : " · rango máximo alcanzado"}
          </p>
        </div>
      </section>

      <section className="tarjeta">
        <div className="logros-cabecera">
          <h1>Logros</h1>
          <span className="mono">
            {alcanzados} / {totalNiveles} niveles
          </span>
        </div>
        <div className="medallero" aria-label="Medallas conseguidas">
          {porTier.map((t) => (
            <span key={t.id} className={`medalla-resumen tier-${t.id}${t.n === 0 ? " vacia" : ""}`}>
              <span aria-hidden="true">{t.emoji}</span> {t.nombre} <b>{t.n}</b>
            </span>
          ))}
        </div>

        <div className="logros-lista">
          {estados.map((e) => {
            const niveles = nivelesDe(e.logro);
            const tierActual = e.actual?.tier;
            return (
              <article key={e.logro.id} className={`logro-tarjeta${e.alcanzados > 0 ? " ok" : ""}${tierActual ? ` tier-${tierActual}` : ""}`}>
                <div className="logro-emoji" aria-hidden="true">
                  {e.logro.emoji}
                </div>
                <div className="logro-cuerpo">
                  <div className="logro-titulo">
                    <b>{e.logro.nombre}</b>
                    {tierActual && (
                      <span className={`logro-tier tier-${tierActual}`}>
                        {emojiDe(tierActual)} {nombreDe(tierActual)}
                      </span>
                    )}
                  </div>
                  <p className="tenue">{e.logro.descripcion((e.siguiente ?? e.actual)!.meta)}</p>

                  <div className="logro-pasos" aria-hidden="true">
                    {niveles.map((n, i) => (
                      <span key={n.tier} className={`paso tier-${n.tier}${i < e.alcanzados ? " on" : ""}`} title={`${nombreDe(n.tier)}: ${num(n.meta)} ${e.logro.unidad}`}>
                        {emojiDe(n.tier)}
                      </span>
                    ))}
                  </div>

                  {e.completo ? (
                    <span className="tenue logro-valor completo">✓ Todos los niveles conseguidos · {num(e.valor)} {e.logro.unidad}</span>
                  ) : (
                    <>
                      <div className="xp-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(e.fraccion * 100)} aria-label={`Progreso de ${e.logro.nombre}`}>
                        <div style={{ width: `${e.fraccion * 100}%` }} />
                      </div>
                      <span className="tenue logro-valor">
                        {num(e.valor)} / {num(e.siguiente!.meta)} {e.logro.unidad} → {emojiDe(e.siguiente!.tier)} {nombreDe(e.siguiente!.tier)}
                      </span>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="tarjeta">
        <h2>Cómo se gana XP</h2>
        <ul className="xp-reglas tenue">
          <li>1 XP por cada 10 caracteres correctos, en tests y entrenos (los calentamientos no cuentan).</li>
          <li>La precisión multiplica: ×0,5 por debajo del 92 %, ×0,8 hasta el 95 %, ×1 hasta el 98 % y ×1,5 desde el 98 %.</li>
          <li>+50 XP por un récord personal con 95 % de precisión o más, y +20 XP por un test limpio (0 errores).</li>
          <li>Curso: +30 XP la primera vez que superas una lección (95 % de precisión o más), +20 XP al dominarla (la dominas al superarla en 3 días distintos, o con 98 % de precisión y velocidad suficiente) y +100 XP al completar un módulo entero.</li>
          <li>La velocidad sola no da más XP: sin precisión, el símil de velocidad va «con el freno puesto».</li>
        </ul>
      </section>
    </div>
  );
}
