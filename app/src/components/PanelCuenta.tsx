import { useState } from "react";
import type { Sesion } from "../hooks/useSesion";
import type { ControladorSync } from "../lib/almacenSincronizado";
import { textoEstadoSync } from "../lib/estadoSync";
import type { EstadoSync } from "../lib/sincronizacion";

interface Props {
  sesion: Sesion;
  estado: EstadoSync;
  controlador: ControladorSync;
}

/** Cuenta y nube dentro de Ajustes: iniciar sesión (Google o correo), estado de la sincronización y borrado. */
export default function PanelCuenta({ sesion, estado, controlador }: Props) {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [confirmaBorrar, setConfirmaBorrar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const conAviso = async (accion: () => Promise<void>, ok?: string) => {
    setAviso(null);
    setOcupado(true);
    try {
      await accion();
      if (ok) setAviso(ok);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo completar la operación.");
    } finally {
      setOcupado(false);
    }
  };

  if (!sesion.disponible) {
    return (
      <>
        <h2>Cuenta</h2>
        <p className="tenue">La nube no está configurada en esta versión: todo se guarda solo en este navegador. Exporta tus datos para llevarlos a otro equipo.</p>
      </>
    );
  }

  if (sesion.cargando) {
    return (
      <>
        <h2>Cuenta</h2>
        <p className="tenue">Comprobando la sesión…</p>
      </>
    );
  }

  if (!sesion.usuario) {
    const puedeEnviar = correo.includes("@") && clave.length >= 6 && !ocupado;
    return (
      <>
        <h2>Cuenta</h2>
        <p className="tenue">
          Con una cuenta, tus intentos se sincronizan entre tus equipos. Sin cuenta todo sigue funcionando igual en este navegador. Solo se guardan
          los datos de tus intentos (ppm, precisión, estadísticas por tecla), nunca lo que escribes.
        </p>
        <div className="fila">
          <button type="button" className="btn primario" disabled={ocupado} onClick={() => void conAviso(sesion.entrarConGoogle)}>
            Entrar con Google
          </button>
        </div>
        <form
          className="cuenta-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (puedeEnviar) void conAviso(() => sesion.entrarConCorreo(correo, clave));
          }}
        >
          <label className="fila">
            <span>Correo</span>
            <input type="email" className="entrada-texto" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </label>
          <label className="fila">
            <span>Contraseña (mínimo 6)</span>
            <input type="password" className="entrada-texto" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} />
          </label>
          <div className="fila">
            <button type="submit" className="btn" disabled={!puedeEnviar}>
              Entrar
            </button>
            <button type="button" className="btn" disabled={!puedeEnviar} onClick={() => void conAviso(() => sesion.crearCuenta(correo, clave))}>
              Crear cuenta
            </button>
          </div>
        </form>
        {sesion.error && (
          <p className="aviso" role="alert">
            {sesion.error}
          </p>
        )}
        {aviso && <p className="tenue">{aviso}</p>}
      </>
    );
  }

  return (
    <>
      <h2>Cuenta</h2>
      <p>
        Sesión iniciada como <b>{sesion.usuario.email ?? sesion.usuario.nombre ?? "tu cuenta"}</b>.
      </p>
      <p className="tenue" role="status">
        {textoEstadoSync(estado)}
      </p>

      {estado.tipo === "cuenta-distinta" && (
        <div className="aviso" role="alert">
          <p>En este navegador hay datos de otra cuenta. ¿Qué hago con ellos?</p>
          <div className="fila">
            <button type="button" className="btn primario" disabled={ocupado} onClick={() => void conAviso(() => controlador.resolverCuentaDistinta("unir"))}>
              Unirlos a esta cuenta
            </button>
            <button type="button" className="btn" disabled={ocupado} onClick={() => void conAviso(() => controlador.resolverCuentaDistinta("limpio"))}>
              Empezar limpio (borra lo de este navegador)
            </button>
          </div>
        </div>
      )}

      <div className="fila">
        <button type="button" className="btn" disabled={ocupado} onClick={() => void conAviso(() => controlador.sincronizar())}>
          Sincronizar ahora
        </button>
        <button type="button" className="btn" disabled={ocupado} onClick={() => void conAviso(sesion.salir)}>
          Cerrar sesión
        </button>
      </div>
      <p className="tenue">Al cerrar sesión tus datos se quedan en este navegador y la app sigue funcionando en local.</p>

      {confirmaBorrar ? (
        <div className="aviso" role="alert">
          <p>Esto borra TODOS tus intentos en la nube y en todos tus equipos. No se puede deshacer. Exporta antes tus datos si quieres una copia.</p>
          <div className="fila">
            <button
              type="button"
              className="btn peligro"
              disabled={ocupado}
              onClick={() =>
                void conAviso(async () => {
                  await controlador.borrarTodoEnNube();
                  setConfirmaBorrar(false);
                }, "Intentos borrados en la nube y en este equipo.")
              }
            >
              Sí, borrar en la nube
            </button>
            <button type="button" className="btn" onClick={() => setConfirmaBorrar(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn" onClick={() => setConfirmaBorrar(true)}>
          Borrar también en la nube…
        </button>
      )}
      {sesion.error && (
        <p className="aviso" role="alert">
          {sesion.error}
        </p>
      )}
      {aviso && <p className="tenue">{aviso}</p>}
    </>
  );
}
