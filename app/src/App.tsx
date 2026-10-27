import { useCallback, useEffect, useMemo, useState } from "react";
import type { Intento } from "./types";
import { useAjustes } from "./hooks/useAjustes";
import { useTecladoFisico } from "./hooks/useTecladoFisico";
import { crearAlmacenIndexedDB } from "./lib/almacen";
import { useIntentos } from "./hooks/useIntentos";
import { formatoReloj } from "./lib/historial";
import { ProveedorContador, useTotalPulsaciones } from "./hooks/ContadorTecleo";
import Hoy from "./components/Hoy";
import Calentar from "./components/Calentar";
import Test from "./components/Test";
import Entrenar, { type FuenteEntrenar, type PedidoEntreno } from "./components/Entrenar";
import Estadisticas from "./components/Estadisticas";
import AjustesPantalla from "./components/AjustesPantalla";

/** Metas de minutos que se pueden elegir en la cabecera. */
const METAS_MINUTOS = [5, 10, 15, 20, 30, 45, 60] as const;

const PESTANAS = [
  { id: "inicio", etiqueta: "Inicio" },
  { id: "calentar", etiqueta: "Calentar" },
  { id: "test", etiqueta: "Test" },
  { id: "entrenar", etiqueta: "Entrenar" },
] as const;

type PestanaId = (typeof PESTANAS)[number]["id"];

/** Icono de la ruedecita de ajustes. */
function IconoEngranaje() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.14 12.94a7.6 7.6 0 0 0 .05-.94 7.6 7.6 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.3 7.3 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.24-1.12.55-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.6 7.6 0 0 0-.05.94c0 .32.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.6.22l2.39-.96c.5.39 1.04.7 1.62.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54a7.3 7.3 0 0 0 1.62-.94l2.39.96c.2.1.47.01.6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2Z"
      />
    </svg>
  );
}

/** El contador de tiempo de la cabecera. Al pasar el ratón o hacer clic deja elegir la meta de minutos. */
function ContadorTiempo({
  segundosHoy,
  metaSeg,
  objetivoMinutos,
  onCambiarObjetivo,
}: {
  segundosHoy: number;
  metaSeg: number;
  objetivoMinutos: number;
  onCambiarObjetivo: (min: number) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div
      className={`contador-tiempo${segundosHoy >= metaSeg ? " cumplido" : ""}${abierto ? " meta-abierta" : ""}`}
      role="status"
      aria-label="Tiempo de práctica de hoy"
      tabIndex={0}
      onFocus={() => setAbierto(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setAbierto(false);
      }}
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <button type="button" className="contador-alterna" aria-haspopup="listbox" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>
        <span className="contador-linea">
          <b>{formatoReloj(segundosHoy)}</b>
          <span>/ {objetivoMinutos} min hoy</span>
        </span>
        <span className="contador-barra">
          <span style={{ width: `${Math.min(100, (segundosHoy / metaSeg) * 100)}%` }} />
        </span>
      </button>
      {abierto && (
        <div className="meta-pop" role="listbox" aria-label="Meta de minutos diarios">
          <div className="meta-pop-caja">
            <p className="tenue">Meta diaria</p>
            {METAS_MINUTOS.map((m) => (
              <button
                key={m}
                type="button"
                className={m === objetivoMinutos ? "on" : ""}
                role="option"
                aria-selected={m === objetivoMinutos}
                onClick={() => {
                  onCambiarObjetivo(m);
                  setAbierto(false);
                }}
              >
                {m} min
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [ajustes, cambiarAjustes] = useAjustes();
  const [pestana, setPestana] = useState<PestanaId>("inicio");
  const tecladoFisico = useTecladoFisico();
  const almacen = useMemo(() => crearAlmacenIndexedDB(), []);
  const { intentos } = useIntentos(almacen);
  const { total: pulsaciones, segundosHoy, api: contador } = useTotalPulsaciones(intentos);
  const metaSeg = ajustes.objetivoMinutos * 60;
  const [pedido, setPedido] = useState<PedidoEntreno | null>(null);
  const practicar = useCallback((fuente: FuenteEntrenar) => {
    setPedido((p) => ({ fuente, n: (p?.n ?? 0) + 1 }));
    setPestana("entrenar");
  }, []);
  const guardar = useCallback((i: Intento) => almacen.add(i), [almacen]);
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  // Esc cierra el panel de ajustes (si no hay una prueba de tecleo debajo: solo se monta abierta de nada tecleando).
  useEffect(() => {
    if (!ajustesAbiertos) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAjustesAbiertos(false);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [ajustesAbiertos]);
  /** Los botones de Hoy navegan; "estadisticas" solo baja a la sección de la misma página. */
  const irDesdeInicio = useCallback(
    (destino: string) => {
      if (destino === "estadisticas") {
        document.getElementById("estadisticas-inicio")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      setPestana(destino as PestanaId);
    },
    []
  );

  return (
    <ProveedorContador api={contador}>
    <div className="app">
      <header className="app-cabecera">
        <div className="logo" onClick={() => setPestana("inicio")}>
          txispa<span>type</span>
        </div>
        <nav className="pestanas" aria-label="Secciones">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={p.id === pestana ? "on" : ""}
              aria-current={p.id === pestana ? "page" : undefined}
              onClick={() => setPestana(p.id)}
            >
              {p.etiqueta}
            </button>
          ))}
        </nav>
        <div className="contadores">
          <ContadorTiempo
            segundosHoy={segundosHoy}
            metaSeg={metaSeg}
            objetivoMinutos={ajustes.objetivoMinutos}
            onCambiarObjetivo={(min) => cambiarAjustes({ objetivoMinutos: min })}
          />
          <div className="contador-pulsaciones" role="status" aria-label="Pulsaciones totales">
            <b>{pulsaciones.toLocaleString("es-ES")}</b>
            <span>pulsaciones</span>
          </div>
          <button type="button" className="btn-rueda" title="Ajustes" aria-label="Ajustes" aria-haspopup="dialog" onClick={() => setAjustesAbiertos(true)}>
            <IconoEngranaje />
          </button>
        </div>
      </header>

      <main className="app-main">
        {!tecladoFisico && (
          <p className="aviso">
            No se detecta teclado físico. Txispa Type se practica con un teclado de verdad.
          </p>
        )}
        {pestana === "inicio" && (
          <>
            <Hoy ajustes={ajustes} intentos={intentos} onIr={irDesdeInicio} />
            <div id="estadisticas-inicio">
              <Estadisticas intentos={intentos} ajustes={ajustes} pulsaciones={pulsaciones} onPracticar={practicar} />
            </div>
          </>
        )}
        {pestana === "calentar" && <Calentar ajustes={ajustes} intentos={intentos} onCambiarAjustes={cambiarAjustes} onIr={setPestana} />}
        {pestana === "test" && <Test ajustes={ajustes} intentos={intentos} onGuardar={guardar} onCambiarAjustes={cambiarAjustes} />}
        {pestana === "entrenar" && <Entrenar ajustes={ajustes} intentos={intentos} onGuardar={guardar} pedido={pedido} />}
      </main>

      {ajustesAbiertos && (
        <div
          className="modal-fondo"
          role="dialog"
          aria-modal="true"
          aria-label="Ajustes"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAjustesAbiertos(false);
          }}
        >
          <div className="tarjeta ajustes-modal">
            <div className="modal-cabecera">
              <h1>Ajustes</h1>
              <button type="button" className="btn" onClick={() => setAjustesAbiertos(false)}>
                Cerrar
              </button>
            </div>
            <AjustesPantalla ajustes={ajustes} onCambiar={cambiarAjustes} almacen={almacen} intentos={intentos} />
          </div>
        </div>
      )}
    </div>
    </ProveedorContador>
  );
}
