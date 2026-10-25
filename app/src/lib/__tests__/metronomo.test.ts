import { describe, it, expect } from "vitest";
import { desviacionAlPulso, desviacionMedia, limitarPulso, periodoMs } from "../metronomo";

describe("metrónomo", () => {
  it("60 ppm son 5 pulsaciones por segundo: un pulso cada 200 ms", () => {
    expect(periodoMs(60)).toBe(200);
    expect(periodoMs(30)).toBe(400);
  });

  it("una pulsación justo en el pulso tiene desviación 0", () => {
    expect(desviacionAlPulso(1000 + 3 * 200, 1000, 200)).toBe(0);
  });

  it("mide la distancia al pulso más cercano, antes o después", () => {
    expect(desviacionAlPulso(1000 + 200 * 4 + 30, 1000, 200)).toBe(30);
    expect(desviacionAlPulso(1000 + 200 * 4 - 30, 1000, 200)).toBe(30);
    expect(desviacionAlPulso(1000 + 200 * 4 + 150, 1000, 200)).toBe(50);
  });

  it("nunca pasa de medio periodo", () => {
    for (let t = 0; t < 1000; t += 7) expect(desviacionAlPulso(t, 13, 200)).toBeLessThanOrEqual(100);
  });

  it("funciona con marcas anteriores a t0", () => {
    expect(desviacionAlPulso(950, 1000, 200)).toBe(50);
  });

  it("desviacionMedia", () => {
    expect(desviacionMedia([])).toBeNull();
    expect(desviacionMedia([10, 20, 30])).toBe(20);
  });

  it("limitarPulso acota a 20-120", () => {
    expect(limitarPulso(5)).toBe(20);
    expect(limitarPulso(500)).toBe(120);
    expect(limitarPulso(47.6)).toBe(48);
  });
});
