import { describe, expect, it } from "vitest";
import { normalizeKlines, type RawKline } from "@/registry/voraui/trading-chart/use-klines";

const raw: RawKline[] = [
  [1_700_000_000_000, "100", "110", "90", "105", "12.5", 1_700_003_599_999],
  [1_700_003_600_000, "105", "108", "104", "107", "3.1", 1_700_007_199_999],
];

describe("normalizeKlines", () => {
  it("maps Binance kline arrays to candles in unix seconds", () => {
    const candles = normalizeKlines(raw, 1_800_000_000_000);
    expect(candles).toEqual([
      { time: 1_700_000_000, open: 100, high: 110, low: 90, close: 105, volume: 12.5, isForming: false },
      { time: 1_700_003_600, open: 105, high: 108, low: 104, close: 107, volume: 3.1, isForming: false },
    ]);
  });

  it("marks the still-open candle as forming", () => {
    const candles = normalizeKlines(raw, 1_700_005_000_000);
    expect(candles[0].isForming).toBe(false);
    expect(candles[1].isForming).toBe(true);
  });

  it("skips malformed rows", () => {
    const bad = [[NaN, "x", "y", "z", "w", "v", NaN]] as unknown as RawKline[];
    expect(normalizeKlines(bad)).toEqual([]);
  });
});
