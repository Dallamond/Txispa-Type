import { useCallback, useMemo, useState } from "react";
import type { Ajustes, Intento } from "../types";
import {
  CURSOS,
  IDS_CURSOS,
  MODULOS_POR_CURSO,
  esModuloLibre,
  idLeccion,
  libresDeCurso,
  requisitoDe,
  type CursoId,
  type Leccion,
  type Modulo,
} from "../data/curso";
import {
  avanceDeCurso,
  avanceDeModulo,
  progresoDeCursos,
  resumenesDeLecciones,
  rutaCompleta,
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

const ICONO: Record<EstadoLeccion, { simbolo: string; texto: string }> = {
  bloqueada: { simbolo: "🔒", texto: "Bloqueada: supera antes la lección anterior" },
  disponible: { simbolo: "○", texto: "Disponible" },
  hecha: { simbolo: "✓", texto: "Hecha" },
  dominada: { simbolo: "★", texto: "Dominada" },
};

/** Pestaña Cursos: el catálogo de cursos y, dentro de cada uno, sus módulos y lecciones, que se aprenden tecleando. */
export default function Curso({ ajustes, intentos, onGuardar }: Props) {
  const [cursoId, setCursoId] = useState<CursoId | null>(null);
  const [elegida, setElegida] = useState<Elegida | null>(null);
  const salir = useCallback(() => setElegida(null), []);
  const repetir = useCallback(() => setElegida((e) => (e ? { ...e, n: e.n + 1 } : e)), []);

  const estados = useMemo(() => progresoDeCursos(intentos, { desbloquearTodo: ajustes.desbloquearCurso }), [intentos, ajustes.desbloquearCurso]);
  const resumenes = useMemo(() => resumenesDeLecciones(intentos), [intentos]);

  if (elegida && cursoId) {
    const { modulo, leccion, n } = elegida;
    const proxima = siguienteLeccion(MODULOS_POR_CURSO[cursoId], modulo, leccion, libresDeCurso(cursoId));
    const puedeSeguir = proxima !== null && estados.get(idLeccion(proxima.modulo, proxima.leccion)) !== "bloqueada";
    return (
      <div>
        <div className="tarjeta cur-leccion">
          <p className="tenue">
            {CURSOS[modulo.curso].nombre} · {modulo.titulo}
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
          intentos={intentos}
          key={`${idLeccion(modulo, leccion)}-${n}`}
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

  if (!cursoId) {
    return (
      <div>
        <div className="tarjeta">
          <h1>Cursos</h1>
          <p className="tenue">
            Aprendes tecleando el código real. Cada línea se cierra con <kbd>Enter</kbd>, la sangría la pone la app y las lecciones cuentan como
            tiempo de práctica. Una lección se da por hecha con un 95 % de precisión.
          </p>
        </div>
        <div className="cur-catalogo">
          {IDS_CURSOS.map((id) => {
            const { hechas, total } = avanceDeCurso(id, estados);
            const requiere = requisitoDe(id);
            const cerrado = requiere !== undefined && !ajustes.desbloquearCurso && !rutaCompleta(requiere, estados);
            return (
              <button type="button" key={id} className={`tarjeta cur-curso${cerrado ? " cerrado" : ""}`} onClick={() => setCursoId(id)}>
                <span className="cur-curso-cab">
                  <h1>{CURSOS[id].nombre}</h1>
                  <span className="cur-avance mono">
                    {hechas}/{total}
                  </span>
                </span>
                <span className="tenue">{CURSOS[id].descripcion}</span>
                <span className="cronometro-barra" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechas} aria-label={`Progreso del curso de ${CURSOS[id].nombre}`}>
                  <span className="cronometro-relleno" style={{ width: `${total ? (hechas / total) * 100 : 0}%` }} />
                </span>
                {cerrado && requiere && <span className="cur-etiqueta">Se abre al completar {CURSOS[requiere].nombre}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const modulos = MODULOS_POR_CURSO[cursoId];
  const continuar = siguienteDisponible(modulos, estados, libresDeCurso(cursoId));
  return (
    <div>
      <div className="tarjeta">
        <button type="button" className="btn" onClick={() => setCursoId(null)}>
          ← Cursos
        </button>
        <h1>Curso de {CURSOS[cursoId].nombre}</h1>
        <p className="tenue">{CURSOS[cursoId].descripcion}</p>
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
      {modulos.map((m) => {
        const { hechas, total } = avanceDeModulo(m, estados);
        return (
          <div className="tarjeta" key={m.id}>
            <div className="cur-modulo-cab">
              <h1>
                {m.id} · {m.titulo}
              </h1>
              {esModuloLibre(m) && <span className="cur-etiqueta">Libre</span>}
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
