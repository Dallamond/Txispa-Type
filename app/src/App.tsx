import { useCallback, useMemo, useState } from "react";
import type { Intento } from "./types";
import { useAjustes } from "./hooks/useAjustes";
import { useTecladoFisico } from "./hooks/useTecladoFisico";
import { crearAlmacenIndexedDB } from "./lib/almacen";
import { useIntentos } from "./hooks/useIntentos";
import Hoy from "./components/Hoy";
import Calentar from "./components/Calentar";
import Test from "./components/Test";
import Entrenar from "./components/Entrenar";
import Estadisticas from "./components/Estadisticas";
import AjustesPantalla from "./components/AjustesPantalla";

const PESTANAS = [
  { id: "hoy", etiqueta: "Hoy" },
  { id: "calentar", etiqueta: "Calentar" },
  { id: "test", etiqueta: "Test" },
  { id: "entrenar", etiqueta: "Entrenar" },
  { id: "estadisticas", etiqueta: "Estadísticas" },
  { id: "ajustes", etiqueta: "Ajustes" },
] as const;

type PestanaId = (typeof PESTANAS)[number]["id"];

export default function App() {
  const [ajustes, cambiarAjustes] = useAjustes();
  const [pestana, setPestana] = useState<PestanaId>("hoy");
  const tecladoFisico = useTecladoFisico();
  const almacen = useMemo(() => crearAlmacenIndexedDB(), []);
  const { intentos } = useIntentos(almacen);
  const guardar = useCallback((i: Intento) => almacen.add(i), [almacen]);

  return (
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
      </header>

      <main className="app-main">
        {!tecladoFisico && (
          <p className="aviso">
            No se detecta teclado físico. Txispa Type se practica con un teclado de verdad.
          </p>
        )}
        {pestana === "hoy" && <Hoy />}
        {pestana === "calentar" && <Calentar />}
        {pestana === "test" && <Test ajustes={ajustes} intentos={intentos} onGuardar={guardar} onCambiarAjustes={cambiarAjustes} />}
        {pestana === "entrenar" && <Entrenar />}
        {pestana === "estadisticas" && <Estadisticas />}
        {pestana === "ajustes" && (
          <AjustesPantalla ajustes={ajustes} onCambiar={cambiarAjustes} almacen={almacen} />
        )}
      </main>
    </div>
  );
}
