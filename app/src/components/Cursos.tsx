import type { Ajustes, Intento } from "../types";
import Curso from "./Curso";
import Logros from "./Logros";

export type VistaCursos = "cursos" | "progreso";

interface Props {
  ajustes: Ajustes;
  intentos: readonly Intento[];
  onGuardar: (intento: Intento) => Promise<void>;
  vista: VistaCursos;
  onVista: (vista: VistaCursos) => void;
}

const VISTAS: readonly { id: VistaCursos; etiqueta: string }[] = [
  { id: "cursos", etiqueta: "Mis cursos" },
  { id: "progreso", etiqueta: "Progreso y logros" },
];

/** Pestaña única de aprendizaje: los cursos y todo lo que mide el progreso (nivel, XP y logros). */
export default function Cursos({ ajustes, intentos, onGuardar, vista, onVista }: Props) {
  return (
    <div>
      <div className="seg cursos-vistas" role="group" aria-label="Vista de cursos">
        {VISTAS.map((v) => (
          <button key={v.id} type="button" className={v.id === vista ? "on" : ""} aria-pressed={v.id === vista} onClick={() => onVista(v.id)}>
            {v.etiqueta}
          </button>
        ))}
      </div>
      {/* El curso sigue montado al cambiar de vista para no perder una lección a medias. */}
      <div hidden={vista !== "cursos"}>
        <Curso ajustes={ajustes} intentos={intentos} onGuardar={onGuardar} />
      </div>
      {vista === "progreso" && <Logros intentos={intentos} objetivoTests={ajustes.objetivoTests} />}
    </div>
  );
}
