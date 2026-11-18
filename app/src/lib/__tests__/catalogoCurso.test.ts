import { describe, expect, it } from "vitest";
import { CURSOS, IDS_CURSOS, MODULOS, MODULOS_POR_CURSO } from "../../data/curso";
import { accionDeCurso, glifoDeCurso, iconoDeModulo, plural, totalesDeCurso } from "../catalogoCurso";

describe("catalogoCurso", () => {
  it("cuenta módulos y lecciones de cada curso", () => {
    for (const id of IDS_CURSOS) {
      const t = totalesDeCurso(MODULOS_POR_CURSO[id]);
      expect(t.modulos).toBe(MODULOS_POR_CURSO[id].length);
      expect(t.lecciones).toBe(MODULOS_POR_CURSO[id].reduce((n, m) => n + m.lecciones.length, 0));
      expect(t.lecciones).toBeGreaterThan(0);
    }
  });

  it("elige el texto del botón según el avance", () => {
    expect(accionDeCurso(0, 10)).toBe("Empezar");
    expect(accionDeCurso(3, 10)).toBe("Continuar");
    expect(accionDeCurso(10, 10)).toBe("Repasar");
  });

  it("pluraliza", () => {
    expect(plural(1, "módulo", "módulos")).toBe("1 módulo");
    expect(plural(7, "módulo", "módulos")).toBe("7 módulos");
  });

  it("todos los módulos tienen icono propio", () => {
    for (const m of MODULOS) expect(iconoDeModulo(m), `${m.curso}/${m.id}`).not.toBe("▫");
  });

  it("cada curso tiene glifo de marcador", () => {
    for (const id of IDS_CURSOS) expect(glifoDeCurso(id), id).not.toBe("···");
  });

  it("los datos de presentación de cada curso están completos", () => {
    for (const id of IDS_CURSOS) {
      const info: { imagen?: string; paraQuien?: string; nivel?: string } = CURSOS[id];
      expect(info.imagen, id).toMatch(/^img\/curso-[a-z]+\.webp$/);
      expect(info.paraQuien, id).toBeTruthy();
      expect(info.nivel, id).toBeTruthy();
    }
  });
});
