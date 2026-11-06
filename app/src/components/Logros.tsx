import { useMemo } from "react";
import type { Intento } from "../types";
import { estadoLogros } from "../lib/logros";
import { nivelDe, RANGOS, xpTotal } from "../lib/xp";

interface Props {
  intentos: readonly Intento[];
  objetivoTests: number;
}

const num = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 1 });

export default function Logros({ intentos, objetivoTests }: Props) {
  const { nivel, estados } = useMemo(
    () => ({ nivel: nivelDe(xpTotal(intentos)), estados: estadoLogros(intentos, { objetivoTests }) }),
    [intentos, objetivoTests]
  );
  const hechos = estados.filter((e) => e.desbloqueado).length;
  const siguienteRango = RANGOS.find((r) => r.desde > nivel.nivel) ?? null;

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
            {hechos} / {estados.length}
          </span>
        </div>
        <div className="logros-lista">
          {estados.map(({ logro, valor, fraccion, desbloqueado }) => (
            <article key={logro.id} className={`logro-tarjeta${desbloqueado ? " ok" : ""}`}>
              <div className="logro-emoji" aria-hidden="true">
                {logro.emoji}
              </div>
              <div className="logro-cuerpo">
                <b>{logro.nombre}</b>
                <p className="tenue">{logro.descripcion}</p>
                <div className="xp-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraccion * 100)} aria-label={`Progreso de ${logro.nombre}`}>
                  <div style={{ width: `${fraccion * 100}%` }} />
                </div>
                <span className="tenue logro-valor">
                  {desbloqueado ? "✓ Desbloqueado" : `${num(valor)} / ${num(logro.meta)} ${logro.unidad}`}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tarjeta">
        <h2>Cómo se gana XP</h2>
        <ul className="xp-reglas tenue">
          <li>1 XP por cada 10 caracteres correctos, en tests y entrenos (los calentamientos no cuentan).</li>
          <li>La precisión multiplica: ×0,5 por debajo del 92 %, ×0,8 hasta el 95 %, ×1 hasta el 98 % y ×1,5 desde el 98 %.</li>
          <li>+50 XP por un récord personal con 95 % de precisión o más, y +20 XP por un test limpio (0 errores).</li>
          <li>La velocidad sola no da más XP: sin precisión, el símil de velocidad va «con el freno puesto».</li>
        </ul>
      </section>
    </div>
  );
}
