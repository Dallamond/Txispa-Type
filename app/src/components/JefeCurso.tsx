import { useState } from "react";
import type { Ajustes, Intento } from "../types";
import type { OpcionJefe } from "../data/curso";
import TecleoCodigo from "./TecleoCodigo";

interface Props {
  opciones: readonly OpcionJefe[];
  codigo: string;
  notas?: readonly string[];
  leccionId: string;
  titulo: string;
  intentos: readonly Intento[];
  ajustes: Ajustes;
  onGuardar: (intento: Intento) => Promise<void> | void;
  onSalir: () => void;
  onRepetir: () => void;
  onSiguiente?: () => void;
}

/** Baraja una copia (Fisher-Yates) para que la correcta no esté siempre en el mismo sitio. */
function barajar<T>(lista: readonly T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Jefe del módulo: primero se diagnostica (elegir el comando correcto del escenario) y después se teclea.
 * Equivocarse no cuesta nada: se explica por qué falla esa opción y se puede elegir otra. Solo cuenta el tecleo. */
export default function JefeCurso({ opciones, ...resto }: Props) {
  const [orden] = useState(() => barajar(opciones));
  const [falladas, setFalladas] = useState<ReadonlySet<string>>(new Set());
  const [acertada, setAcertada] = useState(false);

  if (acertada) return <TecleoCodigo {...resto} />;

  const ultimaFallada = [...falladas].at(-1);
  const razon = orden.find((o) => o.comando === ultimaFallada)?.razon;
  return (
    <div className="tarjeta jefe-opciones">
      <h1>¿Qué comando resuelve el escenario?</h1>
      <ul className="jefe-lista">
        {orden.map((o) => {
          const fallada = falladas.has(o.comando);
          return (
            <li key={o.comando}>
              <button
                type="button"
                className={`jefe-opcion mono${fallada ? " fallada" : ""}`}
                disabled={fallada}
                onClick={() => {
                  if (o.correcta) setAcertada(true);
                  else setFalladas((f) => new Set(f).add(o.comando));
                }}
              >
                {o.comando}
              </button>
            </li>
          );
        })}
      </ul>
      {razon && (
        <p className="jefe-razon" role="alert">
          ✖ {razon}
        </p>
      )}
      <p className="tenue">Al acertar, lo tecleas como examen del módulo (cuenta como cualquier lección: 95 % de precisión).</p>
      <button type="button" className="btn" onClick={resto.onSalir}>
        Salir
      </button>
    </div>
  );
}
