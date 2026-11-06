import { useCallback, useMemo, useState } from "react";
import type { Ajustes, Intento } from "../types";
import { MODULOS, MODULOS_LIBRES, idLeccion, type Leccion, type Modulo } from "../data/curso";
import {
  avanceDeModulo,
  progresoCurso,
  resumenesDeLecciones,
  siguienteDisponible,
  siguienteLeccion,
  type EstadoLeccion,
} from "../lib/progresoCurso";
import TecleoCodigo from "./TecleoCodigo";

interface Props {
  ajustes: Ajustes;
  intentos: readonly Intento[];
  onGuardar: (intento: Intento) => Promise<void>;
}

interface Elegida {
  modulo: Modulo;
  leccion: Leccion;
  /** Cambia en cada repetición para remontar la lección. */
  n: number;
}

const CURSO_NOMBRE = { html: "HTML", css: "CSS" } as const;

const ICONO: Record<EstadoLeccion, { simbolo: string; texto: string }> = {
  bloqueada: { simbolo: "🔒", texto: "Bloqueada: supera antes la lección anterior" },
  disponible: { simbolo: "○", texto: "Disponible" },
  hecha: { simbolo: "✓", texto: "Hecha" },
  dominada: { simbolo: "★", texto: "Dominada" },
};

/** Pestaña Curso: módulos y lecciones de HTML y CSS que se aprenden tecleando el código. */
export default function Curso({ ajustes, intentos, onGuardar }: Props) {
  const [elegida, setElegida] = useState<Elegida | null>(null);
  const salir = useCallback(() => setElegida(null), []);
  const repetir = useCallback(() => setElegida((e) => (e ? { ...e, n: e.n + 1 } : e)), []);

  const estados = useMemo(
    () => progresoCurso(intentos, MODULOS, { desbloquearTodo: ajustes.desbloquearCurso, libres: MODULOS_LIBRES }),
    [intentos, ajustes.desbloquearCurso]
  );
  const resumenes = useMemo(() => resumenesDeLecciones(intentos), [intentos]);

  if (elegida) {
    const { modulo, leccion, n } = elegida;
    const proxima = siguienteLeccion(MODULOS, modulo, leccion, MODULOS_LIBRES);
    const puedeSeguir = proxima !== null && estados.get(idLeccion(proxima.modulo, proxima.leccion)) !== "bloqueada";
    return (
      <div>
        <div className="tarjeta cur-leccion">
          <p className="tenue">
            {CURSO_NOMBRE[modulo.curso]} · {modulo.titulo}
          </p>
          <h1>
            {leccion.id} · {leccion.titulo}
          </h1>
          <p className="cur-explicacion">{leccion.explicacion}</p>
          {leccion.nuevas.length > 0 && (
            <p className="tenue">
              Símbolos nuevos:{" "}
              {leccion.nuevas.map((s) => (
                <kbd key={s}>{s}</kbd>
              ))}
            </p>
          )}
        </div>
        <TecleoCodigo
          key={`${leccion.id}-${n}`}
          codigo={leccion.codigo}
          leccionId={idLeccion(modulo, leccion)}
          titulo={`${leccion.id} · ${leccion.titulo}`}
          ajustes={ajustes}
          onGuardar={onGuardar}
          onSalir={salir}
          onRepetir={repetir}
          onSiguiente={puedeSeguir && proxima ? () => setElegida({ modulo: proxima.modulo, leccion: proxima.leccion, n: 0 }) : undefined}
        />
      </div>
    );
  }

  const continuar = siguienteDisponible(MODULOS, estados, MODULOS_LIBRES);
  return (
    <div>
      <div className="tarjeta">
        <h1>Curso de HTML y CSS</h1>
        <p className="tenue">
          Aprendes HTML5 y CSS3 tecleando código real. Cada línea se cierra con <kbd>Enter</kbd>, la sangría la pone la app y las
          lecciones cuentan como tiempo de práctica. Una lección se da por hecha con un 95 % de precisión.
        </p>
        <div className="cur-acciones">
          {continuar ? (
            <button type="button" className="btn primario" onClick={() => setElegida({ ...continuar, n: 0 })}>
              Continuar: {continuar.leccion.id} · {continuar.leccion.titulo}
            </button>
          ) : (
            <p className="tenue">Has completado todas las lecciones disponibles de la ruta.</p>
          )}
        </div>
      </div>
      {MODULOS.map((m) => {
        const { hechas, total } = avanceDeModulo(m, estados);
        const libre = MODULOS_LIBRES.includes(m.id);
        return (
          <div className="tarjeta" key={m.id}>
            <div className="cur-modulo-cab">
              <h1>
                {m.id} · {m.titulo}
              </h1>
              {libre && <span className="cur-etiqueta">Libre</span>}
              <span className="cur-avance mono">
                {hechas}/{total}
              </span>
            </div>
            <div className="cronometro-barra" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechas} aria-label={`Progreso de ${m.titulo}`}>
              <div className="cronometro-relleno" style={{ width: `${(hechas / total) * 100}%` }} />
            </div>
            <p className="tenue">{m.descripcion}</p>
            <ul className="cur-lista">
              {m.lecciones.map((l) => {
                const id = idLeccion(m, l);
                const estado = estados.get(id) ?? "bloqueada";
                const r = resumenes.get(id);
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      className={`cur-item ${estado}`}
                      disabled={estado === "bloqueada"}
                      title={ICONO[estado].texto}
                      onClick={() => setElegida({ modulo: m, leccion: l, n: 0 })}
                    >
                      <span className="cur-estado" role="img" aria-label={ICONO[estado].texto}>
                        {ICONO[estado].simbolo}
                      </span>
                      <span className="cur-id mono">{l.id}</span>
                      <span className="cur-titulo">{l.titulo}</span>
                      {r && (
                        <span className="cur-mejor tenue">
                          {r.mejorPpm !== null ? `${Math.round(r.mejorPpm)} ppm · ` : ""}
                          {r.mejorPrecision !== null ? `${Math.round(r.mejorPrecision)} %` : ""}
                        </span>
                      )}
                      {l.tipo === "repaso" && <span className="cur-etiqueta">Repaso</span>}
                      <span className="cur-dif" aria-label={`Dificultad ${l.dificultad} de 5`}>
                        {"●".repeat(l.dificultad)}
                        {"○".repeat(5 - l.dificultad)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
