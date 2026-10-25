// Ayudas compartidas por los tests.
import type { Intento } from "../../types";

export function intentoDePrueba(id: string, date: string, extra: Partial<Intento> = {}): Intento {
  return {
    id,
    date,
    localDate: date.slice(0, 10),
    modo: "test",
    fuente: "banco",
    durationSec: 60,
    elapsedSec: 60,
    seed: 1,
    estricto: false,
    correct: 250,
    errors: 10,
    wpm: 50,
    rawWpm: 52,
    acc: 96.2,
    consistency: 70,
    teclas: {},
    pares: {},
    confusiones: {},
    ...extra,
  };
}
