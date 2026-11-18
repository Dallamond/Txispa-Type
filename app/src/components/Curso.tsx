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
  type InfoCurso,
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
import { accionDeCurso, glifoDeCurso, iconoDeModulo, plural, totalesDeCurso } from "../lib/catalogoCurso";
import TecleoCodigo from "./TecleoCodigo";
import JefeCurso from "./JefeCurso";
import "../styles/cursos.css";

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

/** Ilustración de un curso. Mientras falte el archivo (o falle al cargar) se ve el marcador con la rejilla y el glifo. */
function ImagenCurso({ curso, src }: { curso: CursoId; src?: string }) {
  const [rota, setRota] = useState(false);
  return (
    <div className="cc-media" aria-hidden="true">
      <span className="cc-media-glifo">{glifoDeCurso(curso)}</span>
      {src && !rota && <img src={`${import.meta.env.BASE_URL}${src}`} alt="" loading="lazy" onError={() => setRota(true)} />}
    </div>
  );
}

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
    const siguiente = puedeSeguir && proxima ? () => setElegida({ modulo: proxima.modulo, leccion: proxima.leccion, n: 0 }) : undefined;
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
        {leccion.tipo === "jefe" && leccion.opciones ? (
          <JefeCurso
            key={`${idLeccion(modulo, leccion)}-${n}`}
            opciones={leccion.opciones}
            intentos={intentos}
            codigo={leccion.codigo}
            notas={leccion.notas}
            leccionId={idLeccion(modulo, leccion)}
            titulo={`${leccion.id} · ${leccion.titulo}`}
            ajustes={ajustes}
            onGuardar={onGuardar}
            onSalir={salir}
            onRepetir={repetir}
            onSiguiente={siguiente}
          />
        ) : (
          <TecleoCodigo
            intentos={intentos}
            key={`${idLeccion(modulo, leccion)}-${n}`}
            codigo={leccion.codigo}
            notas={leccion.notas}
            leccionId={idLeccion(modulo, leccion)}
            titulo={`${leccion.id} · ${leccion.titulo}`}
            ajustes={ajustes}
            onGuardar={onGuardar}
            onSalir={salir}
            onRepetir={repetir}
            onSiguiente={siguiente}
          />
        )}
      </div>
    );
  }

  if (!cursoId) {
    return (
      <div>
        <section className="tarjeta cc-como" aria-labelledby="cc-como-titulo">
          <h1 id="cc-como-titulo">Cómo funciona un curso</h1>
          <p className="tenue">Aprendes tecleando el código real: practicas la mecanografía y la materia a la vez.</p>
          <ol className="cc-pasos">
            <li>
              <b>Lees y tecleas</b>
              Cada lección explica una idea y te da el código para teclearlo tal cual.
            </li>
            <li>
              <b>
                <kbd>Enter</kbd> cierra la línea
              </b>
              La sangría la pone la app: tú solo escribes el contenido de cada línea.
            </li>
            <li>
              <b>95 % para pasar</b>
              Con un 95 % de precisión la lección se da por hecha y se abre la siguiente.
            </li>
            <li>
              <b>Cuenta como práctica</b>
              Las lecciones suman al tiempo de práctica de hoy, no al récord de ppm de los tests.
            </li>
          </ol>
        </section>
        <div className="cc-catalogo">
          {IDS_CURSOS.map((id) => {
            const info: InfoCurso = CURSOS[id];
            const { hechas, total } = avanceDeCurso(id, estados);
            const { modulos, lecciones } = totalesDeCurso(MODULOS_POR_CURSO[id]);
            const requiere = requisitoDe(id);
            const cerrado = requiere !== undefined && !ajustes.desbloquearCurso && !rutaCompleta(requiere, estados);
            const accion = accionDeCurso(hechas, total);
            return (
              <article key={id} className={`tarjeta cc-curso${cerrado ? " cerrado" : ""}`}>
                <ImagenCurso curso={id} src={info.imagen} />
                <div className="cc-cuerpo">
                  <div className="cc-cab">
                    <h1>{info.nombre}</h1>
                    <span className="cc-avance mono" aria-label={`${hechas} de ${total} lecciones hechas`}>
                      {hechas}/{total}
                    </span>
                  </div>
                  <p className="cc-desc">{info.descripcion}</p>
                  <ul className="cc-datos" aria-label="Datos del curso">
                    <li>{plural(modulos, "módulo", "módulos")}</li>
                    <li>{plural(lecciones, "lección", "lecciones")}</li>
                    {info.nivel && <li>{info.nivel}</li>}
                  </ul>
                  {info.paraQuien && <p className="cc-para">{info.paraQuien}</p>}
                  <span className="cronometro-barra" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechas} aria-label={`Progreso del curso de ${info.nombre}`}>
                    <span className="cronometro-relleno" style={{ width: `${total ? (hechas / total) * 100 : 0}%` }} />
                  </span>
                  <div className="cc-boton-fila">
                    <button type="button" className={`btn cc-boton${accion !== "Repasar" && !cerrado ? " primario" : ""}`} onClick={() => setCursoId(id)}>
                      {accion} {info.nombre}
                    </button>
                    {cerrado && requiere && <span className="cc-aviso">Se abre al completar {CURSOS[requiere].nombre}</span>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  const modulos = MODULOS_POR_CURSO[cursoId];
  const continuar = siguienteDisponible(modulos, estados, libresDeCurso(cursoId));
  const infoCurso: InfoCurso = CURSOS[cursoId];
  const totales = totalesDeCurso(modulos);
  return (
    <div>
      <div className="tarjeta cc-curso-cab">
        <button type="button" className="btn" onClick={() => setCursoId(null)}>
          ← Cursos
        </button>
        <h1>Curso de {infoCurso.nombre}</h1>
        <p className="tenue">{infoCurso.descripcion}</p>
        <ul className="cc-datos" aria-label="Datos del curso">
          <li>{plural(totales.modulos, "módulo", "módulos")}</li>
          <li>{plural(totales.lecciones, "lección", "lecciones")}</li>
          {infoCurso.nivel && <li>{infoCurso.nivel}</li>}
        </ul>
        {infoCurso.paraQuien && <p className="cc-para">{infoCurso.paraQuien}</p>}
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
            <div className="cc-modulo-cab">
              <span className="cc-icono" aria-hidden="true">
                {iconoDeModulo(m)}
              </span>
              <div className="cc-modulo-texto">
                <h1>
                  {m.id} · {m.titulo}
                </h1>
                <p>{m.descripcion}</p>
              </div>
              <div className="cc-modulo-meta">
                {esModuloLibre(m) && <span className="cur-etiqueta">Libre</span>}
                <span className="cc-avance mono" aria-label={`${hechas} de ${total} lecciones hechas`}>
                  {hechas}/{total}
                </span>
              </div>
            </div>
            <div
              className="cronometro-barra cc-modulo-barra"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={hechas}
              aria-label={`Progreso de ${m.titulo}`}
            >
              <div className="cronometro-relleno" style={{ width: `${(hechas / total) * 100}%` }} />
            </div>
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
