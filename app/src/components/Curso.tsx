import { useCallback, useState } from "react";
import type { Ajustes, Intento } from "../types";
import { MODULOS_VISIBLES } from "../data/curso/activos";
import { idLeccion, type Leccion, type Modulo } from "../data/curso";
import TecleoCodigo from "./TecleoCodigo";

interface Props {
  ajustes: Ajustes;
  onGuardar: (intento: Intento) => Promise<void>;
}

interface Elegida {
  modulo: Modulo;
  leccion: Leccion;
  /** Cambia en cada repetición para remontar la lección. */
  n: number;
}

const CURSO_NOMBRE = { html: "HTML", css: "CSS" } as const;

/** Pestaña Curso: módulos y lecciones de HTML y CSS que se aprenden tecleando el código. */
export default function Curso({ ajustes, onGuardar }: Props) {
  const [elegida, setElegida] = useState<Elegida | null>(null);
  const salir = useCallback(() => setElegida(null), []);
  const repetir = useCallback(() => setElegida((e) => (e ? { ...e, n: e.n + 1 } : e)), []);
  // La lección que sigue en el orden del curso, entre los módulos visibles (null si es la última).
  const siguiente = useCallback(() => {
    setElegida((e) => {
      if (!e) return e;
      const orden = MODULOS_VISIBLES.flatMap((modulo) => modulo.lecciones.map((leccion) => ({ modulo, leccion })));
      const i = orden.findIndex((x) => x.leccion === e.leccion);
      const s = orden[i + 1];
      return s ? { modulo: s.modulo, leccion: s.leccion, n: 0 } : e;
    });
  }, []);

  if (elegida) {
    const { modulo, leccion, n } = elegida;
    const ultima = MODULOS_VISIBLES.at(-1)?.lecciones.at(-1) === leccion;
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
          key={n}
          codigo={leccion.codigo}
          leccionId={idLeccion(modulo, leccion)}
          titulo={`${leccion.id} · ${leccion.titulo}`}
          ajustes={ajustes}
          onGuardar={onGuardar}
          onSalir={salir}
          onRepetir={repetir}
          onSiguiente={ultima ? undefined : siguiente}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="tarjeta">
        <h1>Curso de HTML y CSS</h1>
        <p className="tenue">
          Aprendes HTML5 y CSS3 tecleando código real. Cada línea se cierra con <kbd>Enter</kbd>, la sangría la pone la app y las
          lecciones cuentan como tiempo de práctica.
        </p>
      </div>
      {MODULOS_VISIBLES.map((m) => (
        <div className="tarjeta" key={m.id}>
          <h1>
            {m.id} · {m.titulo}
          </h1>
          <p className="tenue">{m.descripcion}</p>
          <ul className="cur-lista">
            {m.lecciones.map((l) => (
              <li key={l.id}>
                <button type="button" className="cur-item" onClick={() => setElegida({ modulo: m, leccion: l, n: 0 })}>
                  <span className="cur-id mono">{l.id}</span>
                  <span className="cur-titulo">{l.titulo}</span>
                  {l.tipo === "repaso" && <span className="cur-etiqueta">Repaso</span>}
                  <span className="cur-dif" aria-label={`Dificultad ${l.dificultad} de 5`}>
                    {"●".repeat(l.dificultad)}
                    {"○".repeat(5 - l.dificultad)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
