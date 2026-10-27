import { useCallback, useMemo, useState } from "react";
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
  { id: "hoy", etiqueta: "Hoy" },
  { id: "calentar", etiqueta: "Calentar" },
  { id: "test", etiqueta: "Test" },
  { id: "entrenar", etiqueta: "Entrenar" },
  { id: "estadisticas", etiqueta: "Estadísticas" },
  { id: "ajustes", etiqueta: "Ajustes" },
] as const;

type PestanaId = (typeof PESTANAS)[number]["id"];

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
  const [pestana, setPestana] = useState<PestanaId>("hoy");
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

  return (
    <ProveedorContador api={contador}>
    <div className="app">
      <header className="app-cabecera">
        <div className="logo">
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
        </div>
      </header>

      <main className="app-main">
        {!tecladoFisico && (
          <p className="aviso">
            No se detecta teclado físico. Txispa Type se practica con un teclado de verdad.
          </p>
        )}
        {pestana === "hoy" && <Hoy ajustes={ajustes} intentos={intentos} onIr={setPestana} />}
        {pestana === "calentar" && <Calentar ajustes={ajustes} intentos={intentos} onCambiarAjustes={cambiarAjustes} onIr={setPestana} />}
        {pestana === "test" && <Test ajustes={ajustes} intentos={intentos} onGuardar={guardar} onCambiarAjustes={cambiarAjustes} />}
        {pestana === "entrenar" && <Entrenar ajustes={ajustes} intentos={intentos} onGuardar={guardar} pedido={pedido} />}
        {pestana === "estadisticas" && <Estadisticas intentos={intentos} ajustes={ajustes} pulsaciones={pulsaciones} onPracticar={practicar} />}
        {pestana === "ajustes" && (
          <AjustesPantalla ajustes={ajustes} onCambiar={cambiarAjustes} almacen={almacen} intentos={intentos} />
        )}
      </main>
    </div>
    </ProveedorContador>
  );
}
