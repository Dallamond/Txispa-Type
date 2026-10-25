// Ajustes en localStorage (`txispatype.settings.v1`). Separados del progreso.
// Los valores guardados se validan al leer: un campo roto vuelve a su valor
// por defecto en vez de romper la app.

import type { Ajustes, Duracion, Rutina } from "../types";

export const CLAVE_AJUSTES = "txispatype.settings.v1";

export const DURACIONES: readonly Duracion[] = [30, 60, 120, 180, 300];
export const RUTINAS: readonly Rutina[] = ["rapida", "estandar", "completa"];

export const AJUSTES_POR_DEFECTO: Ajustes = {
  tema: "oscuro",
  zoom: 1,
  tecladoVisible: true,
  guiaDedos: true,
  objetivoTests: 3,
  objetivoMinutos: 20,
  estrictoPorDefecto: false,
  puntuacionYMayusculas: true,
  duracionPorDefecto: 60,
  rutinaCalentamiento: "estandar",
  reglasDeAjuste: true,
  sonidos: false,
  ollamaUrl: "http://localhost:11434",
  ollamaModelo: "",
};

/** Lo mínimo de `Storage` que usamos; permite tests sin navegador. */
export interface AlmacenClaveValor {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
}

function bool(v: unknown, def: boolean): boolean {
  return typeof v === "boolean" ? v : def;
}

function numero(v: unknown, def: number, min: number, max: number): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def;
}

function texto(v: unknown, def: string): string {
  return typeof v === "string" ? v : def;
}

/** Convierte cualquier valor leído en unos ajustes válidos. */
export function normalizarAjustes(crudo: unknown): Ajustes {
  const d = AJUSTES_POR_DEFECTO;
  const o = (typeof crudo === "object" && crudo !== null ? crudo : {}) as Record<string, unknown>;
  return {
    tema: o.tema === "claro" || o.tema === "oscuro" ? o.tema : d.tema,
    zoom: numero(o.zoom, d.zoom, 0.8, 1.6),
    tecladoVisible: bool(o.tecladoVisible, d.tecladoVisible),
    guiaDedos: bool(o.guiaDedos, d.guiaDedos),
    objetivoTests: Math.round(numero(o.objetivoTests, d.objetivoTests, 1, 20)),
    objetivoMinutos: Math.round(numero(o.objetivoMinutos, d.objetivoMinutos, 1, 240)),
    estrictoPorDefecto: bool(o.estrictoPorDefecto, d.estrictoPorDefecto),
    puntuacionYMayusculas: bool(o.puntuacionYMayusculas, d.puntuacionYMayusculas),
    duracionPorDefecto: DURACIONES.includes(o.duracionPorDefecto as Duracion)
      ? (o.duracionPorDefecto as Duracion)
      : d.duracionPorDefecto,
    rutinaCalentamiento: RUTINAS.includes(o.rutinaCalentamiento as Rutina)
      ? (o.rutinaCalentamiento as Rutina)
      : d.rutinaCalentamiento,
    reglasDeAjuste: bool(o.reglasDeAjuste, d.reglasDeAjuste),
    sonidos: bool(o.sonidos, d.sonidos),
    ollamaUrl: texto(o.ollamaUrl, d.ollamaUrl).trim() || d.ollamaUrl,
    ollamaModelo: texto(o.ollamaModelo, d.ollamaModelo),
  };
}

export function cargarAjustes(almacen: AlmacenClaveValor | null): Ajustes {
  if (!almacen) return { ...AJUSTES_POR_DEFECTO };
  try {
    const bruto = almacen.getItem(CLAVE_AJUSTES);
    return normalizarAjustes(bruto ? JSON.parse(bruto) : null);
  } catch {
    return { ...AJUSTES_POR_DEFECTO };
  }
}

export function guardarAjustes(almacen: AlmacenClaveValor | null, ajustes: Ajustes): void {
  if (!almacen) return;
  try {
    almacen.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
  } catch {
    // Almacenamiento lleno o bloqueado: los ajustes de esta sesión siguen vivos.
  }
}

/** `localStorage` si está disponible (puede lanzar en modo privado). */
export function almacenLocal(): AlmacenClaveValor | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
