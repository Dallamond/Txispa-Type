import { useRef, useState } from "react";
import type { Ajustes, Intento } from "../types";
import type { RunStore } from "../lib/almacen";
import { DURACIONES } from "../lib/ajustes";
import { DURACIONES_CALENTAMIENTO } from "../lib/calentamientos";
import { crearExportacion, leerImportacion, nombreArchivo } from "../lib/exportar";
import { diaLocal } from "../lib/estadisticas";
import { listarModelos } from "../lib/ia";

interface Props {
  ajustes: Ajustes;
  onCambiar: (parcial: Partial<Ajustes>) => void;
  almacen: RunStore;
  intentos: readonly Intento[];
}

export default function AjustesPantalla({ ajustes, onCambiar, almacen, intentos }: Props) {
  const [mensaje, setMensaje] = useState("");
  const [confirmaBorrar, setConfirmaBorrar] = useState(false);
  const archivoRef = useRef<HTMLInputElement | null>(null);
  const [modelos, setModelos] = useState<string[]>([]);
  const [estadoOllama, setEstadoOllama] = useState("");

  async function detectarModelos() {
    setEstadoOllama("Buscando…");
    try {
      const lista = await listarModelos(ajustes.ollamaUrl);
      setModelos(lista);
      if (lista.length === 0) setEstadoOllama("Ollama responde, pero no tiene modelos instalados (ollama pull <modelo>).");
      else {
        setEstadoOllama(`${lista.length} ${lista.length === 1 ? "modelo" : "modelos"} encontrados.`);
        if (!lista.includes(ajustes.ollamaModelo)) onCambiar({ ollamaModelo: lista[0] });
      }
    } catch {
      setModelos([]);
      setEstadoOllama("No se pudo conectar. ¿Ollama está encendido y OLLAMA_ORIGINS incluye el origen de esta web? (ver README)");
    }
  }

  function exportar() {
    const ahora = new Date();
    const datos = crearExportacion(intentos, ajustes, ahora);
    const url = URL.createObjectURL(new Blob([JSON.stringify(datos)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo(diaLocal(ahora));
    a.click();
    URL.revokeObjectURL(url);
    setMensaje(`Exportados ${intentos.length} intentos.`);
  }

  async function importar(archivo: File) {
    const r = leerImportacion(await archivo.text());
    if (!r.ok) {
      setMensaje(r.error);
      return;
    }
    const nuevos = await almacen.importMany(r.intentos);
    if (r.ajustes) onCambiar(r.ajustes);
    const descartados = r.descartados > 0 ? ` ${r.descartados} con formato roto se han descartado.` : "";
    setMensaje(`Importados ${nuevos} intentos nuevos (${r.intentos.length - nuevos} ya existían).${descartados}`);
  }

  async function borrarTodo() {
    await almacen.clear();
    setConfirmaBorrar(false);
    setMensaje("Todos los intentos se han borrado.");
  }

  return (
    <section className="tarjeta">
      <h1>Ajustes</h1>

      <h2>Práctica</h2>
      <label className="fila">
        <span>Tests al día para cumplir el objetivo</span>
        <input
          type="number"
          min={1}
          max={20}
          value={ajustes.objetivoTests}
          onChange={(e) => onCambiar({ objetivoTests: Math.min(20, Math.max(1, Math.round(Number(e.target.value)) || 1)) })}
          className="entrada-num"
        />
      </label>
      <label className="fila">
        <span>Minutos de práctica al día (tests y entrenos)</span>
        <input
          type="number"
          min={1}
          max={240}
          value={ajustes.objetivoMinutos}
          onChange={(e) => onCambiar({ objetivoMinutos: Math.min(240, Math.max(1, Math.round(Number(e.target.value)) || 1)) })}
          className="entrada-num"
        />
      </label>
      <div className="fila">
        <span>Duración por defecto del test</span>
        <div className="seg" role="group" aria-label="Duración por defecto">
          {DURACIONES.map((d) => (
            <button key={d} type="button" className={ajustes.duracionPorDefecto === d ? "on" : ""} onClick={() => onCambiar({ duracionPorDefecto: d })}>
              {d < 60 ? `${d} s` : `${d / 60} min`}
            </button>
          ))}
        </div>
      </div>
      <div className="fila">
        <span>Duración del calentamiento</span>
        <div className="seg" role="group" aria-label="Duración del calentamiento">
          {DURACIONES_CALENTAMIENTO.map((m) => (
            <button key={m} type="button" className={ajustes.calentamientoMin === m ? "on" : ""} onClick={() => onCambiar({ calentamientoMin: m })}>
              {m} min
            </button>
          ))}
        </div>
      </div>
      <label className="fila">
        <span>Modo estricto por defecto</span>
        <input type="checkbox" checked={ajustes.estrictoPorDefecto} onChange={(e) => onCambiar({ estrictoPorDefecto: e.target.checked })} />
      </label>
      <label className="fila">
        <span>Puntuación y mayúsculas</span>
        <input type="checkbox" checked={ajustes.puntuacionYMayusculas} onChange={(e) => onCambiar({ puntuacionYMayusculas: e.target.checked })} />
      </label>

      <h2>IA local (Ollama)</h2>
      <p className="tenue">Opcional. Solo se llama a la dirección de abajo; nada sale a internet. Sin modelo, los entrenos con IA usan el banco de textos.</p>
      <label className="fila">
        <span>Dirección de Ollama</span>
        <input type="text" className="entrada-texto" value={ajustes.ollamaUrl} onChange={(e) => onCambiar({ ollamaUrl: e.target.value })} spellCheck={false} />
      </label>
      <div className="fila">
        <span>Modelo</span>
        <span className="fila-controles">
          {modelos.length > 0 ? (
            <select value={ajustes.ollamaModelo} onChange={(e) => onCambiar({ ollamaModelo: e.target.value })} aria-label="Modelo de Ollama">
              {modelos.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input type="text" className="entrada-texto" value={ajustes.ollamaModelo} placeholder="p. ej. llama3.2" onChange={(e) => onCambiar({ ollamaModelo: e.target.value })} spellCheck={false} aria-label="Modelo de Ollama" />
          )}
          <button type="button" className="btn" onClick={() => void detectarModelos()}>
            Detectar modelos
          </button>
        </span>
      </div>
      {estadoOllama && <p className="tenue" role="status">{estadoOllama}</p>}

      <h2>Pantalla</h2>
      <div className="fila">
        <span>Tema</span>
        <div className="seg" role="group" aria-label="Tema">
          {(["oscuro", "claro"] as const).map((t) => (
            <button key={t} type="button" className={ajustes.tema === t ? "on" : ""} onClick={() => onCambiar({ tema: t })}>
              {t === "oscuro" ? "Oscuro" : "Claro"}
            </button>
          ))}
        </div>
      </div>
      <label className="fila">
        <span>Tamaño del texto ({Math.round(ajustes.zoom * 100)}%)</span>
        <input
          type="range"
          min={0.8}
          max={1.6}
          step={0.1}
          value={ajustes.zoom}
          onChange={(e) => onCambiar({ zoom: Number(e.target.value) })}
        />
      </label>
      <label className="fila">
        <span>Teclado visible</span>
        <input type="checkbox" checked={ajustes.tecladoVisible} onChange={(e) => onCambiar({ tecladoVisible: e.target.checked })} />
      </label>
      <label className="fila">
        <span>Guía de dedos</span>
        <input type="checkbox" checked={ajustes.guiaDedos} onChange={(e) => onCambiar({ guiaDedos: e.target.checked })} />
      </label>

      <h2>Datos</h2>
      <p className="tenue">Todo se guarda en este navegador (IndexedDB). Exporta una copia de vez en cuando: {intentos.length} intentos guardados.</p>
      <div className="acciones">
        <button type="button" className="btn" onClick={exportar}>
          Exportar JSON
        </button>
        <button type="button" className="btn" onClick={() => archivoRef.current?.click()}>
          Importar JSON
        </button>
        <input
          ref={archivoRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importar(f);
            e.target.value = "";
          }}
        />
        {confirmaBorrar ? (
          <>
            <button type="button" className="btn peligro" onClick={() => void borrarTodo()}>
              Sí, borrar todo
            </button>
            <button type="button" className="btn" onClick={() => setConfirmaBorrar(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className="btn peligro" onClick={() => setConfirmaBorrar(true)}>
            Borrar todos los intentos
          </button>
        )}
      </div>
      <p className="tenue" role="status">
        {mensaje}
      </p>
    </section>
  );
}
