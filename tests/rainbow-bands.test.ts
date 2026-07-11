import { describe, expect, it } from "vitest";
import {
  DEFAULT_RAINBOW_BANDS,
  findActiveBand,
  rainbowPriceAt,
} from "@/registry/voraui/btc-rainbow-chart/lib/rainbow-bands";

const GENESIS_MS = Date.UTC(2009, 0, 3);
const DAY_MS = 86_400_000;

describe("rainbowPriceAt", () => {
  it("computes the center regression price at a known day count", () => {
    // 1000 days after genesis: 10 ^ (5.84 * log10(1000) - 17.01) = 10 ^ 0.51
    const price = rainbowPriceAt(GENESIS_MS + 1000 * DAY_MS, 0);
    expect(price).toBeCloseTo(Math.pow(10, 0.51), 6);
  });

  it("shifts by the band offset in log10 space", () => {
    const dateMs = GENESIS_MS + 1000 * DAY_MS;
    const center = rainbowPriceAt(dateMs, 0);
    expect(rainbowPriceAt(dateMs, 0.5)).toBeCloseTo(center * Math.pow(10, 0.5), 6);
  });

  it("clamps dates at or before genesis to one day", () => {
    expect(rainbowPriceAt(GENESIS_MS, 0)).toBeCloseTo(rainbowPriceAt(GENESIS_MS + DAY_MS, 0), 10);
  });
});

describe("findActiveBand", () => {
  const dateMs = GENESIS_MS + 4000 * DAY_MS;

  it("returns the top band for a price above every ceiling", () => {
    const top = rainbowPriceAt(dateMs, 0.5);
    expect(findActiveBand(top * 2, dateMs)?.key).toBe("b1");
  });

  it("returns null for a price below every ceiling", () => {
    const bottom = rainbowPriceAt(dateMs, -0.62);
    expect(findActiveBand(bottom / 2, dateMs)).toBeNull();
  });

  it("returns the first ceiling crossed walking top to bottom", () => {
    // Just above the b5 ceiling but below b4's.
    const b5 = DEFAULT_RAINBOW_BANDS.find((b) => b.key === "b5")!;
    const price = rainbowPriceAt(dateMs, b5.offset) * 1.01;
    expect(findActiveBand(price, dateMs)?.key).toBe("b5");
  });

  it("ships exactly 9 bands ordered top to bottom", () => {
    expect(DEFAULT_RAINBOW_BANDS).toHaveLength(9);
    const offsets = DEFAULT_RAINBOW_BANDS.map((b) => b.offset);
    expect(offsets).toEqual([...offsets].sort((a, b) => b - a));
  });
});
