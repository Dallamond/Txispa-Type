// Tipos compartidos. El modelo de datos sigue docs/ESPECIFICACION-TECNICA.md §2.

export interface KeyDef {
  id: string;
  base: string;
  shift?: string;
  altgr?: string;
  /** 0 = meñique izq … 7 = meñique der, 8 = pulgar. */
  finger: number;
  cls?: "wide" | "xwide" | "space";
}

/** Los calentamientos NO se guardan: solo existen estos dos modos. */
export type Modo = "test" | "entreno";
export type Fuente = "banco" | "debiles" | "alternancia" | "ia" | "ejercicio";

export interface TeclaStat {
  /** Pulsaciones esperadas con esa tecla. */
  n: number;
  /** Errores (se pulsó otra cosa o faltó al cerrar la palabra). */
  e: number;
  /** Suma de intervalos válidos (ms). */
  ms: number;
  /** Número de intervalos válidos. */
  msN: number;
}

export interface ParStat {
  n: number;
  ms: number;
}

export interface Intento {
  id: string;
  /** ISO-8601. */
  date: string;
  /** "YYYY-MM-DD" en hora local (Europe/Madrid). */
  localDate: string;
  modo: Modo;
  fuente: Fuente;
  /** Si fuente === "ejercicio". */
  ejercicioId?: string;
  /** Si fuente === "ia": hash de cada texto generado que se usó (el modelo no es determinista). */
  iaHashes?: string[];
  durationSec: number;
  elapsedSec: number;
  seed: number;
  estricto: boolean;
  /** Caracteres correctos (incluye el espacio de cierre). */
  correct: number;
  /** Errores permanentes. */
  errors: number;
  /** Palabras por minuto netas, 1 decimal. */
  wpm: number;
  /** Palabras por minuto brutas, 1 decimal. */
  rawWpm: number;
  /** Precisión 0-100, 1 decimal. */
  acc: number;
  /** 0-100, o null si hay pocos datos. */
  consistency: number | null;
  /** Clave: carácter en minúscula; el espacio es "␣". */
  teclas: Record<string, TeclaStat>;
  /** Clave: dos caracteres, p. ej. "er". */
  pares: Record<string, ParStat>;
  /** Clave: "esperada>escrita", p. ej. "v>b". */
  confusiones: Record<string, number>;
}

export type Duracion = 30 | 60 | 120 | 180 | 300;
export type Rutina = "rapida" | "estandar" | "completa";

export interface Ajustes {
  tema: "oscuro" | "claro";
  zoom: number;
  tecladoVisible: boolean;
  guiaDedos: boolean;
  /** Tests por día para dar el objetivo por cumplido. */
  objetivoTests: number;
  /** Minutos de práctica al día (tests y entrenos) para dar la meta de tiempo por cumplida. */
  objetivoMinutos: number;
  estrictoPorDefecto: boolean;
  puntuacionYMayusculas: boolean;
  duracionPorDefecto: Duracion;
  rutinaCalentamiento: Rutina;
  reglasDeAjuste: boolean;
  sonidos: boolean;
  ollamaUrl: string;
  ollamaModelo: string;
}
