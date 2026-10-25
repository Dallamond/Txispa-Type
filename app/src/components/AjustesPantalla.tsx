import { useState } from "react";
import type { Ajustes, Intento } from "../types";
import type { RunStore } from "../lib/almacen";

interface Props {
  ajustes: Ajustes;
  onCambiar: (parcial: Partial<Ajustes>) => void;
  almacen: RunStore;
}

/** Fase 1: solo lo básico y una prueba de que IndexedDB guarda y lee. */
export default function AjustesPantalla({ ajustes, onCambiar, almacen }: Props) {
  const [diagnostico, setDiagnostico] = useState("");

  async function probarAlmacen() {
    setDiagnostico("Probando…");
    try {
      const id = `prueba-${crypto.randomUUID()}`;
      const ahora = new Date();
      const prueba: Intento = {
        id,
        date: ahora.toISOString(),
        localDate: ahora.toLocaleDateString("sv", { timeZone: "Europe/Madrid" }),
        modo: "test",
        fuente: "banco",
        durationSec: 60,
        elapsedSec: 60,
        seed: 0,
        estricto: false,
        correct: 0,
        errors: 0,
        wpm: 0,
        rawWpm: 0,
        acc: 100,
        consistency: null,
        teclas: {},
        pares: {},
        confusiones: {},
      };
      await almacen.add(prueba);
      const leidos = await almacen.list();
      const esta = leidos.some((i) => i.id === id);
      await almacen.clear();
      setDiagnostico(esta ? "IndexedDB correcto: se guardó, se leyó y se borró." : "Fallo: no se encontró el intento guardado.");
    } catch (e) {
      setDiagnostico(`Fallo: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <section className="tarjeta">
      <h1>Ajustes</h1>

      <div className="fila">
        <span>Tema</span>
        <div className="seg">
          {(["oscuro", "claro"] as const).map((t) => (
            <button key={t} type="button" className={ajustes.tema === t ? "on" : ""} onClick={() => onCambiar({ tema: t })}>
              {t === "oscuro" ? "Oscuro" : "Claro"}
            </button>
          ))}
        </div>
      </div>

      <label className="fila">
        <span>Teclado visible</span>
        <input type="checkbox" checked={ajustes.tecladoVisible} onChange={(e) => onCambiar({ tecladoVisible: e.target.checked })} />
      </label>

      <label className="fila">
        <span>Guía de dedos</span>
        <input type="checkbox" checked={ajustes.guiaDedos} onChange={(e) => onCambiar({ guiaDedos: e.target.checked })} />
      </label>

      <h2>Datos</h2>
      <p className="tenue">Todo se guarda en este navegador (IndexedDB).</p>
      <div className="fila">
        <button type="button" className="btn" onClick={probarAlmacen}>
          Probar almacenamiento
        </button>
        <span className="tenue" role="status">
          {diagnostico}
        </span>
      </div>
    </section>
  );
}
