import { useMemo, useState } from "react";
import { useRanking } from "../hooks/useRanking";
import { perfilPublicoDesde, validarAlias, type RankingStore } from "../lib/ranking";
import type { Intento } from "../types";
import "../ranking.css";

const CLAVE_ALIAS = "txispatype.ranking.alias";

function leerAlias(): string {
  try {
    return localStorage.getItem(CLAVE_ALIAS) ?? "";
  } catch {
    return "";
  }
}
function guardarAlias(alias: string | null): void {
  try {
    if (alias === null) localStorage.removeItem(CLAVE_ALIAS);
    else localStorage.setItem(CLAVE_ALIAS, alias);
  } catch {
    /* sin almacenamiento: se pedirá el alias otra vez */
  }
}

interface Props {
  store: RankingStore;
  intentos: Intento[];
  /** El ranking exige sesión: sin ella solo se puede ver la tabla. */
  haySesion: boolean;
}

const formato = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Ranking público opt-in de mejor ppm en test. Sin XP ni verificación. */
export default function Ranking({ store, intentos, haySesion }: Props) {
  const datos = useRanking(store);
  const perfil = useMemo(() => perfilPublicoDesde(intentos), [intentos]);
  const [aliasGuardado, setAliasGuardado] = useState(leerAlias);
  const [quiere, setQuiere] = useState(false);
  const [alias, setAlias] = useState(aliasGuardado);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorAlias, setErrorAlias] = useState<string | null>(null);

  const publicado = datos.puesto !== null;
  const interruptor = publicado || quiere;
  const miClave = aliasGuardado.toLowerCase();

  const publicarCon = async (nombre: string) => {
    if (!perfil) return;
    const v = validarAlias(nombre);
    if (!v.valido) {
      setErrorAlias(v.motivo);
      return;
    }
    setEnviando(true);
    setErrorAlias(null);
    setAviso(null);
    try {
      if (!(await store.aliasLibre(nombre))) {
        setErrorAlias("Ese alias ya está ocupado. Prueba con otro.");
        return;
      }
      await store.publicar({ alias: nombre, ...perfil });
      guardarAlias(nombre);
      setAliasGuardado(nombre);
      setQuiere(false);
      setAviso("Publicado. Tu marca ya aparece en el ranking.");
      datos.recargar();
    } catch (e) {
      setErrorAlias(e instanceof Error ? e.message : "No se pudo publicar.");
    } finally {
      setEnviando(false);
    }
  };

  const salir = async () => {
    setEnviando(true);
    setAviso(null);
    try {
      await store.retirar();
      guardarAlias(null);
      setAliasGuardado("");
      setQuiere(false);
      setAviso("Has salido del ranking. Tu alias y tu marca se han borrado.");
      datos.recargar();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo salir del ranking.");
    } finally {
      setEnviando(false);
    }
  };

  const alternar = () => {
    if (publicado) void salir();
    else setQuiere((q) => !q);
  };

  return (
    <section className="ranking" aria-labelledby="ranking-titulo">
      <h2 id="ranking-titulo">Ranking</h2>
      <p className="tenue">Mejor ppm en test con precisión del 95 % o más. Solo participa quien quiere.</p>

      <div className="ranking-tabla-caja" aria-busy={datos.estado === "cargando"}>
        {datos.estado === "cargando" && (
          <p className="tenue" role="status">
            {datos.lento ? "Esto va más lento de lo normal. Sigo intentándolo…" : "Cargando el ranking…"}
          </p>
        )}
        {datos.estado === "error" && (
          <div role="alert">
            <p>{datos.error ?? "No se pudo cargar el ranking."}</p>
            <button type="button" onClick={datos.recargar}>
              Reintentar
            </button>
          </div>
        )}
        {datos.estado === "ok" && datos.filas.length === 0 && <p className="tenue">Todavía no hay nadie en el ranking. Puedes ser el primero.</p>}
        {datos.estado === "ok" && datos.filas.length > 0 && (
          <table className="ranking-tabla">
            <caption className="sr-only">Mejores ppm en test</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Alias</th>
                <th scope="col">ppm</th>
                <th scope="col">Precisión</th>
                <th scope="col">Tests</th>
              </tr>
            </thead>
            <tbody>
              {datos.filas.map((f, i) => {
                const mia = publicado && f.alias.toLowerCase() === miClave;
                return (
                  <tr key={f.alias} className={mia ? "ranking-mia" : undefined} aria-current={mia ? "true" : undefined}>
                    <td>{i + 1}</td>
                    <th scope="row">
                      {f.alias}
                      {mia ? " (tú)" : ""}
                    </th>
                    <td>{formato(f.mejorWpm)}</td>
                    <td>{formato(f.accMejor)} %</td>
                    <td>{f.tests}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {datos.estado === "ok" && publicado && <p className="tenue">Tu puesto: {datos.puesto}.</p>}
      </div>

      <div className="ranking-optin">
        {!haySesion ? (
          <p className="tenue">Para entrar en el ranking necesitas iniciar sesión en Ajustes. Verlo es libre.</p>
        ) : !perfil ? (
          <p className="tenue">Aún no tienes ningún test con precisión del 95 % o más. Haz uno y vuelve.</p>
        ) : (
          <>
            <button type="button" role="switch" aria-checked={interruptor} className="ranking-interruptor" onClick={alternar} disabled={enviando}>
              <span className="ranking-pomo" aria-hidden="true" />
              Aparecer en el ranking público
            </button>
            <p className="tenue">
              Es un ranking de la comunidad y no está verificado: las marcas las envía cada navegador y alguien con conocimientos podría falsearlas.
              Se publica solo tu alias, tu mejor ppm, tu mejor precisión y el número de tests; nunca lo que escribes ni tu correo.
            </p>

            {quiere && !publicado && (
              <form
                className="ranking-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void publicarCon(alias.trim());
                }}
              >
                <label htmlFor="ranking-alias">Alias público</label>
                <input
                  id="ranking-alias"
                  value={alias}
                  onChange={(e) => {
                    setAlias(e.target.value);
                    setErrorAlias(null);
                  }}
                  maxLength={20}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={errorAlias !== null}
                  aria-describedby="ranking-alias-ayuda"
                />
                <p id="ranking-alias-ayuda" className="tenue">
                  De 3 a 20 caracteres: letras sin tilde, números, guion y guion bajo. No se distingue entre mayúsculas y minúsculas.
                </p>
                <button type="submit" disabled={enviando || alias.trim() === ""}>
                  {enviando ? "Publicando…" : "Publicar mi marca"}
                </button>
              </form>
            )}

            {publicado && (
              <div className="ranking-acciones">
                {aliasGuardado && (
                  <button type="button" onClick={() => void publicarCon(aliasGuardado)} disabled={enviando}>
                    Actualizar mi marca
                  </button>
                )}
                <button type="button" onClick={() => void salir()} disabled={enviando}>
                  Salir del ranking
                </button>
              </div>
            )}
          </>
        )}
        <p className="ranking-msg" role="status" aria-live="polite">
          {errorAlias ?? aviso ?? ""}
        </p>
      </div>
    </section>
  );
}
